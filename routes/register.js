import { Router } from "express";
import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import dotenv from "dotenv";
import NewMembers from "../models/newMembers.js";
dotenv.config();
const router = Router();
const OAuth2 = google.auth.OAuth2;

// Helper function to encode email body for Gmail API
function makeBody(to, from, subject, message) {
  const str = [
    "Content-Type: text/html; charset=\"UTF-8\"\n",
    "MIME-Version: 1.0\n",
    "Content-Transfer-Encoding: 7bit\n",
    "to: ", to, "\n",
    "from: ", from, "\n",
    "subject: ", subject, "\n\n",
    message
  ].join('');

  return Buffer.from(str).toString("base64").replace(/\+/g, '-').replace(/\//g, '_');
}

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

/* Legacy SMTP Test Endpoint (Commented out)
... (preserved comments)
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

    // Send welcome email using Direct Gmail API (Port 443)
    try {
      const oauth2Client = new OAuth2(
        process.env.CLIENT_ID,
        process.env.CLIENT_SECRET,
        "https://developers.google.com/oauthplayground"
      );

      oauth2Client.setCredentials({
        refresh_token: process.env.REFRESH_TOKEN
      });

      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

      const htmlBody = `
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
        `;

      const rawMessage = makeBody(
        email,
        `Cloud Community Club (C³) <${process.env.EMAIL_USER}>`,
        "🎉 Welcome to Cloud Community Club (C³) Membership!",
        htmlBody
      );

      await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: rawMessage
        }
      });

      console.log("✅ Email sent successfully via Gmail API");

    } catch (emailError) {
      console.error('❌ API Error (Email Failed):', emailError.message);
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