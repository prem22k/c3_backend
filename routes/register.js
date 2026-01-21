import { Router } from "express";
import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import dotenv from "dotenv";
import NewMembers from "../models/newMembers.js";
dotenv.config();
const router = Router();
const OAuth2 = google.auth.OAuth2;

// Create the OAuth2 Client
const createTransporter = async () => {
  try {
    const oauth2Client = new OAuth2(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
      "https://developers.google.com/oauthplayground"
    );

    oauth2Client.setCredentials({
      refresh_token: process.env.REFRESH_TOKEN
    });

    const accessToken = await oauth2Client.getAccessToken();

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: process.env.EMAIL_USER,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN,
        accessToken: accessToken.token,
      },
    });

    return transporter;
  } catch (error) {
    console.log("Error creating transporter:", error);
    return null;
  }
};

// GET route for registration endpoint
router.get("/", (req, res) => {
  res.status(200).json({
    message: "Registration API is working",
    instructions: "Please use POST method to register a new member",
    endpoints: {
      register: "POST /api/register - Register a new member"
    }
  });
});

// Legacy SMTP Test Endpoint (Commented out for OAuth2 migration)
/*
router.get("/test-email", async (req, res) => {
  try {
    // Use standard Gmail service preset
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      pool: false,
    });

    await transporter.verify();
    
    res.status(200).json({
      message: "SMTP Test Results",
      environment: {
        service: "gmail",
        EMAIL_USER: process.env.EMAIL_USER ? "***configured***" : "not configured"
      },
      results: [{
        config: "service: gmail",
        status: "success",
        message: "Connection verified successfully"
      }]
    });
  } catch (error) {
    res.status(500).json({
      message: "SMTP test failed",
      error: error.message
    });
  }
});
*/

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

    // Send welcome email using OAuth2
    const transporter = await createTransporter();

    if (transporter) {
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

      /* Legacy SMTP Sending Logic (Commented out)
      try {
        // Use standard Gmail service preset which handles ports/secure settings automatically
        // combined with the global IPv4 fix in server.js
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
          pool: false, // Use a fresh connection to avoid stale socket timeouts
        });

        // Verify connection before sending
        await transporter.verify();
        await transporter.sendMail(mailOptions);
      } catch (error) { ... }
      */

      try {
        await transporter.sendMail(mailOptions);
        console.log("Email sent successfully via OAuth2");
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        // Don't fail the registration if email fails
      }
    } else {
      console.error('Failed to create OAuth2 transporter');
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