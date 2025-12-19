const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("../models/User");
const { sendPasswordResetEmail } = require("../utils/emailService");

const JWT_SECRET = process.env.JWT_SECRET || "photoflow-demo-secret";

// Login: find user by email and validate password (demo: plaintext). Returns JWT.
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }
    // Find user and validate password using bcrypt
    const user = await User.findOne({ email }).lean();
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = jwt.sign(
      { sub: String(user._id), email: user.email },
      JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    // Do not return password in response
    if (user.password) delete user.password;
    return res.json({ token, user });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("auth.login error", e);
    return res.status(500).json({ message: "Login failed" });
  }
};

// Register: create a new user in MongoDB and return JWT + user
exports.register = async (req, res) => {
  try {
    const { email, password, name } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const exists = await User.findOne({ email }).lean();
    if (exists) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Hash password before saving
    const hashed = await bcrypt.hash(password, 10);
    const doc = new User({
      email,
      password: hashed,
      name: name || "New User",
    });
    await doc.save();

    const token = jwt.sign(
      { sub: String(doc._id), email: doc.email },
      JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    const userObj = doc.toObject ? doc.toObject() : doc;
    if (userObj.password) delete userObj.password;

    return res.status(201).json({ token, user: userObj });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("auth.register error", e);
    return res.status(500).json({ message: "Registration failed" });
  }
};

// Logout: client can simply discard JWT; server-side blacklisting omitted for demo
exports.logout = (req, res) => {
  return res.json({ message: "Logged out" });
};

// Forgot Password: Generate reset token and send to user
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists for security
      return res.status(200).json({
        message:
          "If an account with that email exists, a password reset link has been sent",
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiration

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = resetExpires;
    await user.save();

    // Send password reset email
    const resetUrl = `${
      process.env.FRONTEND_URL || "http://localhost:3000"
    }/reset-password/${resetToken}`;

    console.log(`📧 Sending password reset email to: ${email}`);
    const emailResult = await sendPasswordResetEmail(
      email,
      resetToken,
      resetUrl
    );

    if (!emailResult.success) {
      console.warn(
        `⚠️  Failed to send password reset email to ${email}: ${emailResult.message}`
      );
    }

    return res.status(200).json({
      message:
        "If an account with that email exists, a password reset link has been sent",
      // For demo only - remove in production
      resetUrl: process.env.NODE_ENV !== "production" ? resetUrl : undefined,
    });
  } catch (e) {
    console.error("auth.forgotPassword error", e);
    return res.status(500).json({ message: "Forgot password request failed" });
  }
};

// Reset Password: Validate token and update password
exports.resetPassword = async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body || {};

    if (!token || !password || !confirmPassword) {
      return res.status(400).json({
        message: "Token, password, and password confirmation are required",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters long",
      });
    }

    // Hash the token to find user
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired reset token",
      });
    }

    // Hash new password and update
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();

    console.log(`✅ Password successfully reset for user: ${user.email}`);

    return res.status(200).json({
      message:
        "Password has been successfully reset. Please login with your new password.",
    });
  } catch (e) {
    console.error("auth.resetPassword error", e);
    return res.status(500).json({ message: "Password reset failed" });
  }
};

// Verify Reset Token: Check if token is valid
exports.verifyResetToken = async (req, res) => {
  try {
    const { token } = req.params || {};

    if (!token) {
      return res.status(400).json({ message: "Token is required" });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token" });
    }

    return res.status(200).json({ message: "Token is valid" });
  } catch (e) {
    console.error("auth.verifyResetToken error", e);
    return res.status(500).json({ message: "Token verification failed" });
  }
};
