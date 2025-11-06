const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Note = require("../models/Note");
const auth = require("../middleware/authMiddleware");

const router = express.Router();

// ===============================
// Multer Storage Configuration
// ===============================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
});

// ===============================
// ✅ Upload a New Note
// ===============================
router.post("/", auth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const newNote = new Note({
      user: req.user.id,
      title: req.body.title,
      subject: req.body.subject,
      tags: req.body.tags ? req.body.tags.split(",").map(t => t.trim()) : [],
      filePath: req.file.path,
    });

    await newNote.save();
    res.status(201).json({ message: "Note uploaded successfully", note: newNote });
  } catch (error) {
    console.error("Upload Error:", error.message);
    res.status(500).json({ message: "Error uploading note", error: error.message });
  }
});

// ===============================
// ✅ Get All Notes for Logged-in User
// ===============================
router.get("/mine", auth, async (req, res) => {
  try {
    const notes = await Note.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(notes);
  } catch (error) {
    console.error("Fetch Notes Error:", error.message);
    res.status(500).json({ message: "Error fetching notes" });
  }
});

// ===============================
// ✅ Download a Note File
// ===============================
router.get("/download/:id", auth, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: "Note not found" });

    // Verify user owns this note
    if (note.user.toString() !== req.user.id)
      return res.status(403).json({ message: "Unauthorized access" });

    const filePath = path.resolve(note.filePath);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found on server" });
    }

    res.download(filePath, path.basename(filePath));
  } catch (error) {
    console.error("Download Error:", error.message);
    res.status(500).json({ message: "Error downloading note" });
  }
});

// ===============================
// ✅ Delete a Note
// ===============================
router.delete("/:id", auth, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: "Note not found" });

    if (note.user.toString() !== req.user.id)
      return res.status(403).json({ message: "Unauthorized" });

    // Remove file from disk
    if (fs.existsSync(note.filePath)) fs.unlinkSync(note.filePath);

    await note.deleteOne();
    res.json({ message: "Note deleted successfully" });
  } catch (error) {
    console.error("Delete Error:", error.message);
    res.status(500).json({ message: "Error deleting note" });
  }
});

module.exports = router;
