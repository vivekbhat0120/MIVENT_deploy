const nodemailer = require("nodemailer");

// Email service configuration
let transporter;

// Initialize email transporter
const initializeEmailTransporter = () => {
  // Using Gmail SMTP for demo (you can replace with your email service)
  // For production, use environment variables for sensitive data
  const emailService = process.env.EMAIL_SERVICE || "gmail";
  const emailUser = process.env.EMAIL_USER;
  const emailPassword = process.env.EMAIL_PASSWORD;
  const emailHost = process.env.EMAIL_HOST;
  const emailPort = process.env.EMAIL_PORT;

  if (!emailUser || !emailPassword) {
    console.warn(
      "⚠️  Email credentials not configured. Password reset emails will not be sent."
    );
    console.warn(
      "    Please set EMAIL_USER and EMAIL_PASSWORD in your .env file."
    );
    console.warn(
      "    See backend/PASSWORD_RESET_SETUP.md for setup instructions."
    );
    return null;
  }

  // Custom SMTP configuration
  if (emailHost && emailPort) {
    transporter = nodemailer.createTransport({
      host: emailHost,
      port: parseInt(emailPort),
      secure: emailPort === "465", // true for 465, false for other ports
      auth: {
        user: emailUser,
        pass: emailPassword,
      },
    });
    console.log(
      `✅ Email transporter initialized with custom SMTP: ${emailHost}:${emailPort}`
    );
  } else {
    // Use email service (gmail, outlook, etc.)
    transporter = nodemailer.createTransport({
      service: emailService,
      auth: {
        user: emailUser,
        pass: emailPassword,
      },
    });
    console.log(
      `✅ Email transporter initialized with ${emailService} service`
    );
  }

  return transporter;
};

// Send password reset email
const sendPasswordResetEmail = async (email, resetToken, resetUrl) => {
  try {
    // Initialize transporter if not already done
    if (!transporter) {
      transporter = initializeEmailTransporter();
    }

    if (!transporter) {
      console.log(
        `⚠️  Password reset requested for ${email} but email is not configured.`
      );
      console.log(`    Reset link (for testing): ${resetUrl}`);
      console.log(
        `    Configure email service to send actual emails. See PASSWORD_RESET_SETUP.md`
      );
      return {
        success: false,
        message: "Email service not configured",
      };
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset Request - MIVENT",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f5f5f5; padding: 20px; text-align: center; border-radius: 5px;">
            <h2 style="color: #333; margin: 0;">Password Reset Request</h2>
          </div>
          
          <div style="padding: 30px; background-color: #fff; border: 1px solid #e0e0e0;">
            <p style="color: #666; font-size: 16px;">Hello,</p>
            
            <p style="color: #666; font-size: 16px;">
              We received a request to reset your password for your MIVENT account. 
              Click the link below to reset your password:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-size: 16px; display: inline-block;">
                Reset Password
              </a>
            </div>
            
            <p style="color: #999; font-size: 14px;">
              Or copy and paste this link in your browser:
            </p>
            <p style="color: #007bff; font-size: 13px; word-break: break-all; background-color: #f9f9f9; padding: 10px; border-radius: 3px;">
              ${resetUrl}
            </p>
            
            <p style="color: #666; font-size: 14px; margin-top: 20px;">
              <strong>This link will expire in 1 hour.</strong>
            </p>
            
            <p style="color: #666; font-size: 14px;">
              If you didn't request a password reset, you can safely ignore this email.
            </p>
          </div>
          
          <div style="background-color: #f5f5f5; padding: 15px; text-align: center; border-top: 1px solid #e0e0e0; margin-top: 20px;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              © 2025 MIVENT. All rights reserved.
            </p>
          </div>
        </div>
      `,
      text: `Password Reset Request\n\nHello,\n\nWe received a request to reset your password for your MIVENT account. Click the link below to reset your password:\n\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you didn't request a password reset, you can safely ignore this email.\n\n© 2025 MIVENT. All rights reserved.`,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log(`✅ Password reset email sent to ${email}`);
    console.log(`   Message ID: ${info.messageId}`);
    return {
      success: true,
      message: "Password reset email sent successfully",
      messageId: info.messageId,
    };
  } catch (error) {
    console.error("❌ Error sending password reset email:", error.message);
    if (error.code === "EAUTH") {
      console.error(
        "   Authentication failed. Check your EMAIL_USER and EMAIL_PASSWORD."
      );
      console.error(
        "   For Gmail, ensure you're using an App Password, not your regular password."
      );
    } else if (error.code === "ECONNECTION") {
      console.error(
        "   Connection failed. Check your internet connection and email service status."
      );
    }
    return {
      success: false,
      message: "Failed to send password reset email",
      error: error.message,
    };
  }
};

module.exports = {
  initializeEmailTransporter,
  sendPasswordResetEmail,
};
