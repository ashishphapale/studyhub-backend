// backend/models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      trim: true,
      minlength: [3, "Username must be at least 3 characters long"],
      maxlength: [30, "Username must be under 30 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email address",
      ],
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
      select: false, // ✅ prevent returning password by default in queries
    },

    avatar: {
      type: String,
      default: "https://cdn-icons-png.flaticon.com/512/149/149071.png", // ✅ default profile avatar
    },
  },
  { timestamps: true } // ✅ auto adds createdAt, updatedAt
);

// ✅ When converting to JSON, hide sensitive fields
userSchema.set("toJSON", {
  transform: function (doc, ret) {
    delete ret.password; // hide password
    delete ret.__v; // remove version key
    return ret;
  },
});

// ✅ Optional: Index email for faster login lookup
userSchema.index({ email: 1 });

module.exports = mongoose.model("User", userSchema);
