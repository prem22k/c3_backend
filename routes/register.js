import { Router } from "express";
import nodemailer from 'nodemailer';
import dotenv from "dotenv";
import NewMembers from "../models/newMembers.js";
dotenv.config();
const router = Router();

// GET route for registration endpoint
router.get("/", (req, res) => {
  res.status(200).json({
    message: "Registration API is working",
    instructions: "Please use POST method to register a new member",
    endpoints: {
      register: "POST /api/register - Register a new member",
      testEmail: "GET /api/register/test-email - Test SMTP connection"
    }
  });
});

// Test email endpoint for debugging SMTP issues
router.get("/test-email", async (req, res) => {
  try {
    const smtpConfigs = [
      {
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: process.env.SMTP_PORT || 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
        tls: {
          rejectUnauthorized: false,
          ciphers: 'SSLv3'
        },
        connectionTimeout: 60000,
        greetingTimeout: 30000,
        socketTimeout: 60000,
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
        rateDelta: 20000,
        rateDelta: 20000,
        rateLimit: 5,
        family: 4 // Force IPv4 to avoid Render/Gmail timeouts
      },
      {
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
        tls: {
          rejectUnauthorized: false,
        },
        connectionTimeout: 60000,
        greetingTimeout: 30000,
        socketTimeout: 60000,
        family: 4 // Force IPv4 to avoid Render/Gmail timeouts
      }
    ];

    const results = [];

    for (const config of smtpConfigs) {
      try {
        const transporter = nodemailer.createTransport(config);
        await transporter.verify();
        results.push({
          config: `${config.host}:${config.port} (${config.secure ? 'SSL' : 'TLS'})`,
          status: 'success',
          message: 'Connection verified successfully'
        });
      } catch (error) {
        results.push({
          config: `${config.host}:${config.port} (${config.secure ? 'SSL' : 'TLS'})`,
          status: 'failed',
          error: error.message,
          code: error.code
        });
      }
    }

    res.status(200).json({
      message: "SMTP Test Results",
      environment: {
        SMTP_HOST: process.env.SMTP_HOST || "smtp.gmail.com",
        SMTP_PORT: process.env.SMTP_PORT || "587",
        EMAIL_USER: process.env.EMAIL_USER ? "***configured***" : "not configured"
      },
      results
    });
  } catch (error) {
    res.status(500).json({
      message: "SMTP test failed",
      error: error.message
    });
  }
});

// POST route for form submission
router.post("/", async (req, res) => {
  try {
    const {
      name,
      email,
      mobile,
      rollNumber,
      department,
      year,
      interests,
      experience,
      expectations,
      referral
    } = req.body;

    // Validate required fields
    if (!name || !email || !mobile || !rollNumber || !department || !year || !interests || interests.length === 0) {
      return res.status(400).json({
        message: "error",
        error: "All required fields must be provided"
      });
    }

    // Upsert: Update existing member or create new one
    // This allows users to retry if email sending failed previously
    const memberData = {
      name,
      email,
      mobile,
      rollNumber,
      department,
      year,
      interests,
      experience,
      expectations,
      referral,
    };

    await NewMembers.findOneAndUpdate(
      { email },
      memberData,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Send welcome email
    try {
      // Try multiple SMTP configurations for better reliability
      const smtpConfigs = [
        {
          host: process.env.SMTP_HOST || "smtp.gmail.com",
          port: process.env.SMTP_PORT || 587,
          secure: false,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
          tls: {
            rejectUnauthorized: false,
            ciphers: 'SSLv3'
          },
          connectionTimeout: 60000,
          greetingTimeout: 30000,
          socketTimeout: 60000,
          pool: true,
          maxConnections: 5,
          maxMessages: 100,
          rateDelta: 20000,
          rateDelta: 20000,
          rateLimit: 5,
          family: 4 // Force IPv4 to avoid Render/Gmail timeouts
        },
        {
          host: process.env.SMTP_HOST || "smtp.gmail.com",
          port: 465,
          secure: true,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
          tls: {
            rejectUnauthorized: false,
          },
          connectionTimeout: 60000,
          greetingTimeout: 30000,
          socketTimeout: 60000,
          family: 4 // Force IPv4 to avoid Render/Gmail timeouts
        }
      ];

      let transporter = null;
      let lastError = null;

      // Try each configuration until one works
      for (const config of smtpConfigs) {
        try {
          transporter = nodemailer.createTransport(config);
          // Test the connection
          await transporter.verify();
          console.log('SMTP connection verified successfully');
          break;
        } catch (error) {
          console.log(`SMTP config failed: ${config.host}:${config.port}, trying next...`);
          lastError = error;
          continue;
        }
      }

      if (!transporter) {
        throw lastError || new Error('All SMTP configurations failed');
      }

      const mailOptions = {
        from: `Cloud Community Club (C³) <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "🎉 Welcome to Cloud Community Club (C³) Membership!",
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <title>Welcome to Cloud Community Club</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
              <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #4285f4;">Welcome to C³!</h1>
                <p>Hey <strong>${name}</strong>,</p>
                <p>Thank you for registering as a member of the <strong>Cloud Community Club (C³)</strong>! We're thrilled to have you join our community of tech enthusiasts, innovators, and future leaders. 🚀</p>
                
                <div style="background-color: #f1f3f4; padding: 20px; border-left: 4px solid #4285f4; margin: 20px 0;">
                  <h3 style="color: #4285f4; margin-top: 0;">Your Membership Details</h3>
                  <p><strong>Name:</strong> ${name}</p>
                  <p><strong>Department:</strong> ${department}</p>
                  <p><strong>Year:</strong> ${year}</p>
                </div>

                <h3 style="color: #4285f4;">What's Next?</h3>
                <ul>
                  <li>You are now officially subscribed to our newsletter</li>
                  <li>You'll receive regular updates about upcoming events and workshops</li>
                  <li>All important club announcements will be shared via this email</li>
                </ul>

                <p>Stay tuned for our next event - details coming soon!</p>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                  <p style="color: #666; font-size: 14px;">
                    Best regards,<br>
                    Cloud Community Club Team
                  </p>
                </div>
              </div>
            </body>
          </html>
        `
      };

      await transporter.sendMail(mailOptions);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Don't fail the registration if email fails
    }

    // Send success response
    return res.status(200).json({
      message: "success",
      data: {
        name,
        email,
        department,
        year
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      message: "error",
      error: "An error occurred during registration"
    });
  }
});

export default router;