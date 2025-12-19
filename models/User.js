const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, default: "New User" },
  password: { type: String, required: true }, // demo: plaintext (consider hashing)
  role: { type: String, default: "photographer" },
  passwordResetToken: { type: String, default: null },
  passwordResetExpires: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", UserSchema);
