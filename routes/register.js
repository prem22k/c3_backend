import { Router } from "express";
import nodemailer from'nodemailer';
import dotenv from "dotenv";
import Registration from "../models/registration.js";
import NewMembers from "../models/newMembers.js";
import mongoose from "mongoose";
dotenv.config();
const router = Router();

// Function to generate a unique registration ID
const generateRegistrationID = () => {
  return "C3-" + Math.floor(100000 + Math.random() * 900000); // Example: C3-123456
};

// POST route for form submission
router.post("/", async (req, res) => {
  try {
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      return res.status(500).json({
        status: "error",
        message: "Database connection error",
        details: "Unable to connect to the database. Please try again later."
      });
    }

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
        status: "error",
        message: "All required fields must be provided",
        details: "Please fill in all the required fields"
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid email format",
        details: "Please provide a valid email address"
      });
    }

    // Check if the email already exists
    const existingUser = await NewMembers.findOne({ email });
    if (existingUser) {
      return res.status(200).json({ 
        status: "already_registered",
        message: "You are already registered!",
        details: "This email is already registered in our system. Welcome back!"
      });
    }

    // Generate a unique registration ID
    //const registrationID = generateRegistrationID();

    // Save registration to MongoDB
    const newRegistration = new NewMembers({
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
      //registrationID,
    });
    
    await newRegistration.save();

    // Check if email configuration is available
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res.status(201).json({
        status: "partial_success",
        message: "Registration successful, but email notification is not configured",
        details: "You are registered, but the system is not configured to send emails."
      });
    }

    // Create a transporter using environment variables
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: true,
      auth: {
        user: process.env.EMAIL_USER, // no-reply@cloudcommunityclub.in
        pass: process.env.EMAIL_PASS, // noreply@snisT1
      },
      tls: {
        rejectUnauthorized: false,
      }
    });

    // Verify email configuration before sending
    try {
      await transporter.verify();
    } catch (verifyError) {
      console.error('Email configuration error:', verifyError);
      return res.status(201).json({
        status: "partial_success",
        message: "Registration successful, but email service is not available",
        details: "You are registered, but we couldn't send the confirmation email. Our team will contact you soon."
      });
    }

    // Mail options with proper sender address
    const mailOptions = {
      from: `Cloud Community Club (C³) <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "🎉 Welcome to Cloud Community Club (C³) Membership!",
      html: `
      
 <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
      <html xmlns="http://www.w3.org/1999/xhtml">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Welcome to Cloud Community Club</title>
        <style type="text/css">
          /* CLIENT-SPECIFIC STYLES */
          body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
          table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
          img { -ms-interpolation-mode: bicubic; }
  
          /* RESET STYLES */
          img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
          table { border-collapse: collapse !important; }
          body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; }
  
          /* iOS BLUE LINKS */
          a[x-apple-data-detectors] {
            color: inherit !important;
            text-decoration: none !important;
            font-size: inherit !important;
            font-family: inherit !important;
            font-weight: inherit !important;
            line-height: inherit !important;
          }
  
          /* MOBILE STYLES */
          @media screen and (max-width: 600px) {
            .img-max {
              width: 100% !important;
              max-width: 100% !important;
              height: auto !important;
            }
  
            .max-width {
              max-width: 100% !important;
            }
  
            .mobile-wrapper {
              width: 85% !important;
              max-width: 85% !important;
            }
  
            .mobile-padding {
              padding-left: 5% !important;
              padding-right: 5% !important;
            }
          }
  
          /* ANDROID CENTER FIX */
          div[style*="margin: 16px 0;"] { margin: 0 !important; }
        </style>
      </head>
      <body style="margin: 0 !important; padding: 0 !important; background-color: #f8f9fa;">
        <!-- HIDDEN PREHEADER TEXT -->
        <div style="display: none; font-size: 1px; color: #fefefe; line-height: 1px; font-family: Arial, Helvetica, sans-serif; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
          Welcome to Cloud Community Club (C³)! We're excited to have you join our tech community.
        </div>
        
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td align="center" valign="top" width="100%" bgcolor="#f8f9fa" style="padding: 30px 0;">
              <table border="0" cellpadding="0" cellspacing="0" width="600" class="max-width">
                <!-- HEADER -->
                <tr>
                  <td align="center" valign="top" style="padding: 0;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td align="center" valign="top" bgcolor="#4285f4" style="border-radius: 8px 8px 0 0; padding: 30px 20px;">
                          <h1 style="color: #ffffff; font-family: Arial, Helvetica, sans-serif; font-size: 28px; font-weight: bold; margin: 0;">Welcome to C³!</h1>
                          <p style="color: #ffffff; font-family: Arial, Helvetica, sans-serif; font-size: 16px; margin: 5px 0 0;">Where Innovation Meets Community</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- CONTENT -->
                <tr>
                  <td align="center" valign="top" bgcolor="#ffffff" style="border-radius: 0 0 8px 8px; padding: 30px 30px 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <!-- GREETING -->
                      <tr>
                        <td align="left" style="padding: 0 0 20px; font-family: Arial, Helvetica, sans-serif; font-size: 16px; line-height: 25px; color: #333333;">
                          <p style="margin: 0;">Hey <strong>${name}</strong>,</p>
                        </td>
                      </tr>
                      
                      <!-- INTRO -->
                      <tr>
                        <td align="left" style="padding: 0 0 20px; font-family: Arial, Helvetica, sans-serif; font-size: 16px; line-height: 25px; color: #333333;">
                          <p style="margin: 0;">Thank you for registering as a member of the <strong>Cloud Community Club (C³)</strong>! We're thrilled to have you join our community of tech enthusiasts, innovators, and future leaders. 🚀</p>
                        </td>
                      </tr>
                      
                      <!-- MEMBERSHIP DETAILS -->
                      <tr>
                        <td align="left" bgcolor="#f1f3f4" style="padding: 20px; border-left: 4px solid #4285f4; border-radius: 4px; margin: 25px 0; font-family: Arial, Helvetica, sans-serif;">
                          <h3 style="color: #4285f4; font-size: 18px; font-weight: bold; margin: 0 0 15px;">🆔 Your Membership Details</h3>
                          <p style="margin: 0 0 10px;"><strong>Name:</strong> ${name}</p>
 
                          <p style="margin: 0;"><strong>Branch :</strong>${department} </p>
                           <p style="margin: 0;"><strong> Year:</strong>${year}</p>
                        
                        </td>
                      </tr>
                      
                      <!-- SPACING -->
                      <tr>
                        <td height="20"></td>
                      </tr>
                      
                      <!-- WHAT HAPPENS NEXT -->
                      <tr>
                        <td align="left" style="font-family: Arial, Helvetica, sans-serif; font-size: 16px; line-height: 25px; color: #333333;">
                          <h3 style="color: #4285f4; font-size: 18px; font-weight: bold; margin: 0 0 15px;">🔔 What Happens Next?</h3>
                          <ul style="padding: 0 0 0 20px; margin: 0 0 20px;">
                            <li style="margin: 0 0 10px;"><strong>You are now officially subscribed to our newsletter</strong></li>
                            <li style="margin: 0 0 10px;">You'll receive regular updates about upcoming events, workshops, and opportunities</li>
                            <li style="margin: 0 0 10px;">All important club announcements will be shared via this email address</li>
                            <li style="margin: 0 0 10px;">Be on the lookout for our next event - details coming soon!</li>
        </ul>
                        </td>
                      </tr>
                      
                      <!-- SPACING -->
                      <tr>
                        <td height="10"></td>
                      </tr>
                      
                      <!-- BENEFITS SECTION -->
                      <tr>
                        <td align="left" style="font-family: Arial, Helvetica, sans-serif; font-size: 16px; line-height: 25px; color: #333333;">
                          <h3 style="color: #4285f4; font-size: 18px; font-weight: bold; margin: 0 0 15px;">🚀 What's in Store for C³ Members?</h3>
                        </td>
                      </tr>
                      
                      <!-- BENEFITS GRID -->
                      <tr>
                        <td>
                          <table border="0" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                              <td width="50%" align="left" valign="top" style="padding: 0 10px 10px 0;">
                                <table border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#f1f3f4" style="border-radius: 4px;">
                                  <tr>
                                    <td style="padding: 15px; font-family: Arial, Helvetica, sans-serif;">
                                      <p style="margin: 0 0 5px; font-weight: bold; color: #4285f4;">Research & Projects</p>
                                      <p style="margin: 0; font-size: 14px;">Work on real-world challenges</p>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                              <td width="50%" align="left" valign="top" style="padding: 0 0 10px 10px;">
                                <table border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#f1f3f4" style="border-radius: 4px;">
                                  <tr>
                                    <td style="padding: 15px; font-family: Arial, Helvetica, sans-serif;">
                                      <p style="margin: 0 0 5px; font-weight: bold; color: #4285f4;">Open Source Development</p>
                                      <p style="margin: 0; font-size: 14px;">Contribute to global projects</p>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td width="50%" align="left" valign="top" style="padding: 10px 10px 0 0;">
                                <table border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#f1f3f4" style="border-radius: 4px;">
                                  <tr>
                                    <td style="padding: 15px; font-family: Arial, Helvetica, sans-serif;">
                                      <p style="margin: 0 0 5px; font-weight: bold; color: #4285f4;">Hackathons</p>
                                      <p style="margin: 0; font-size: 14px;">Compete, collaborate, showcase</p>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                              <td width="50%" align="left" valign="top" style="padding: 10px 0 0 10px;">
                                <table border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#f1f3f4" style="border-radius: 4px;">
                                  <tr>
                                    <td style="padding: 15px; font-family: Arial, Helvetica, sans-serif;">
                                      <p style="margin: 0 0 5px; font-weight: bold; color: #4285f4;">Workshops & Events</p>
                                      <p style="margin: 0; font-size: 14px;">Learn from industry experts</p>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      
                      <!-- SPACING -->
                      <tr>
                        <td height="20"></td>
                      </tr>
                      
                      <!-- CONNECT WITH US -->
                      <tr>
                        <td align="center" bgcolor="#e8f0fe" style="padding: 20px; border-radius: 4px; font-family: Arial, Helvetica, sans-serif;">
                          <h3 style="color: #4285f4; font-size: 18px; font-weight: bold; margin: 0 0 15px;">💬 Connect With Us</h3>
                          <p style="margin: 0 0 20px;">Stay updated and engage with fellow members through our community channels:</p>
                          
                          <table border="0" cellpadding="0" cellspacing="0">
                            <tr>
                              <td align="center" style="border-radius: 30px;" bgcolor="#ffffff">
                                <a href="${process.env.WhatsappLink}" target="_blank" style="font-size: 16px; font-family: Arial, Helvetica, sans-serif; color: #4285f4; text-decoration: none; border-radius: 30px; padding: 10px 20px; border: 1px solid #4285f4; display: inline-block; font-weight: bold;">Join WhatsApp</a>
                              </td>
                              <td width="20"></td>
                              <td align="center" style="border-radius: 30px;" bgcolor="#ffffff">
                                <a href="${process.env.InstragramLink}" target="_blank" style="font-size: 16px; font-family: Arial, Helvetica, sans-serif; color: #4285f4; text-decoration: none; border-radius: 30px; padding: 10px 20px; border: 1px solid #4285f4; display: inline-block; font-weight: bold;">Follow Instagram</a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      
                      <!-- SPACING -->
                      <tr>
                        <td height="20"></td>
                      </tr>
                      
                      <!-- CONTACT INFO -->
                      <tr>
                        <td align="left" style="padding: 0 0 20px; font-family: Arial, Helvetica, sans-serif; font-size: 16px; line-height: 25px; color: #333333;">
                          <p style="margin: 0;">If you have any questions or need assistance, feel free to reach out to us at <a href="mailto:pingus@cloudcommunityclub.in" style="color: #4285f4; text-decoration: underline;">pingus@cloudcommunityclub.in</a></p>
                        </td>
                      </tr>
                      
                      <!-- CLOSING -->
                      <tr>
                        <td align="left" style="padding: 0 0 20px; font-family: Arial, Helvetica, sans-serif; font-size: 16px; line-height: 25px; color: #333333;">
                          <p style="margin: 0;">We're excited to have you on board and can't wait to see what we'll build together!</p>
                        </td>
                      </tr>
                      
                      <!-- SIGNATURE -->
                      <tr>
                        <td align="left" style="padding: 0; font-family: Arial, Helvetica, sans-serif; font-size: 16px; line-height: 25px; color: #333333;">
                          <p style="margin: 0;"><strong>Best Regards,</strong><br><strong>Team C³</strong></p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- FOOTER -->
                <tr>
                  <td align="center" style="padding: 20px 0 0;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td align="center" style="padding: 20px; font-family: Arial, Helvetica, sans-serif; font-size: 12px; line-height: 20px; color: #999999;">
                          <p style="margin: 0;">You're receiving this email because you've registered for C³ membership.<br>If you believe this was sent in error, please contact us.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    

    

      
      `
    };
  

  
    // Send email with enhanced error handling
    try {
      await transporter.sendMail(mailOptions);
      return res.status(201).json({
        status: "success",
        message: "Registration successful!",
        details: "Welcome to Cloud Community Club (C³)! We've sent you a confirmation email."
      });
    } catch (emailError) {
      console.error('Failed to send email:', emailError);
      return res.status(201).json({
        status: "partial_success",
        message: "Registration successful, but email notification failed",
        details: "You are registered, but we couldn't send the confirmation email. Please check your email address."
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      status: "error",
      message: "Registration failed",
      details: "An unexpected error occurred. Please try again later."
    });
  }
});

export default router;