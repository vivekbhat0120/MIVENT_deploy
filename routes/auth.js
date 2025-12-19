const express = require("express");
const router = express.Router();
const controller = require("../controllers/authController");

router.post("/login", controller.login);
router.post("/register", controller.register);
router.post("/logout", controller.logout);
router.post("/forgot-password", controller.forgotPassword);
router.post("/reset-password", controller.resetPassword);
router.get("/verify-reset-token/:token", controller.verifyResetToken);

module.exports = router;
