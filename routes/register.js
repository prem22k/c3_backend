import { Router } from "express";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import Registration from "../models/registration.js";
import axios from "axios";
import fs from "fs";
import { promisify } from "util";
import path from "path";
import { fileURLToPath } from "url";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

dotenv.config();
const router = Router();

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create temp directory for PDFs if it doesn't exist
const tempDir = path.join(__dirname, "../temp");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

const writeFileAsync = promisify(fs.writeFile);
const unlinkAsync = promisify(fs.unlink);

// Configure Nodemailer with Hostinger SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true, // Use SSL
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Function to generate a unique registration ID
const generateRegistrationID = () => {
  return "C3-" + Math.floor(100000 + Math.random() * 900000); // Example: C3-123456
};

// Function to generate membership ID card PDF using pdf-lib
async function generateIDCard(userData, collegeLogoPath, clubLogoPath) {
  try {
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([400, 550]);

    // Embed font
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Define colors
    const black = rgb(0, 0, 0);
    const white = rgb(1, 1, 1);
    const darkBlue = rgb(0.05, 0.05, 0.2); // Darker blue
    const lightGray = rgb(0.95, 0.95, 0.95);
    
    // Gradient colors for header (from darker to lighter)
    const headerGradient = [
      rgb(0.05, 0.05, 0.2),
      rgb(0.1, 0.1, 0.25),
      rgb(0.15, 0.15, 0.3),
    ];

    // Load logos
    const collegeLogoBytes = fs.readFileSync(collegeLogoPath);
    const clubLogoBytes = fs.readFileSync(clubLogoPath);
    const collegeLogo = await pdfDoc.embedPng(collegeLogoBytes);
    const clubLogo = await pdfDoc.embedPng(clubLogoBytes);

    // Calculate logo dimensions while maintaining aspect ratio
    const collegeLogoAspectRatio = collegeLogo.width / collegeLogo.height;
    const clubLogoAspectRatio = clubLogo.width / clubLogo.height;
    
    const maxLogoHeight = 60;
    const maxLogoWidth = 150;

    // Calculate dimensions for college logo
    let collegeLogoWidth = maxLogoHeight * collegeLogoAspectRatio;
    let collegeLogoHeight = maxLogoHeight;
    if (collegeLogoWidth > maxLogoWidth) {
      collegeLogoWidth = maxLogoWidth;
      collegeLogoHeight = maxLogoWidth / collegeLogoAspectRatio;
    }

    // Calculate dimensions for club logo
    let clubLogoWidth = maxLogoHeight * clubLogoAspectRatio;
    let clubLogoHeight = maxLogoHeight;
    if (clubLogoWidth > maxLogoWidth) {
      clubLogoWidth = maxLogoWidth;
      clubLogoHeight = maxLogoWidth / clubLogoAspectRatio;
    }

    // Function to handle text overflow
    const drawTextWithOverflow = (text, x, y, maxWidth, size, font, color) => {
      const characters = text.split('');
      let currentText = '';
      let currentWidth = 0;
      
      for (const char of characters) {
        const charWidth = font.widthOfTextAtSize(char, size);
        if (currentWidth + charWidth > maxWidth) {
          currentText += '...';
          break;
        }
        currentText += char;
        currentWidth += charWidth;
      }
      
      page.drawText(currentText, {
        x,
        y,
        size,
        font,
        color,
      });
    };

    // Draw main background
    page.drawRectangle({
      x: 20,
      y: 20,
      width: 360,
      height: 510,
      color: white,
      borderColor: black,
      borderWidth: 2,
    });

    // Draw gradient header background
    const headerHeight = 100;
    const stripeHeight = headerHeight / headerGradient.length;
    
    headerGradient.forEach((color, index) => {
      page.drawRectangle({
        x: 20,
        y: 510 - headerHeight + (index * stripeHeight),
        width: 360,
        height: stripeHeight + 1,
        color: color,
      });
    });

    // Draw logos with adjusted positioning
    page.drawImage(collegeLogo, {
      x: 40,  // Adjusted position
      y: 440,
      width: collegeLogoWidth,
      height: collegeLogoHeight,
    });

    page.drawImage(clubLogo, {
      x: 280, // Adjusted position
      y: 440,
      width: clubLogoWidth,
      height: clubLogoHeight,
    });

    // Draw title with proper spacing
    try {
      const titleText = "Cloud Community Club (C³)";
      const titleX = (400 - boldFont.widthOfTextAtSize(titleText, 24)) / 2; // Center text
      
      page.drawText(titleText, {
        x: titleX,
        y: 350, // Adjusted position
        size: 24,
        font: boldFont,
        color: black,
      });
    } catch (error) {
      // Fallback for superscript
      const baseText = "Cloud Community Club (C";
      const baseX = (400 - boldFont.widthOfTextAtSize(baseText + ")", 24)) / 2;
      
      page.drawText(baseText, {
        x: baseX,
        y: 350,
        size: 24,
        font: boldFont,
        color: black,
      });

      page.drawText("3", {
        x: baseX + boldFont.widthOfTextAtSize(baseText, 24),
        y: 360,
        size: 14,
        font: boldFont,
        color: black,
      });

      page.drawText(")", {
        x: baseX + boldFont.widthOfTextAtSize(baseText, 24) + 8,
        y: 350,
        size: 24,
        font: boldFont,
        color: black,
      });
    }

    // Draw subtitle centered
    const subtitleText = "Open Session Ticket";
    const subtitleX = (400 - boldFont.widthOfTextAtSize(subtitleText, 18)) / 2;
    
    page.drawText(subtitleText, {
      x: subtitleX,
      y: 320,
      size: 18,
      font: boldFont,
      color: black,
    });

    // Add details section with overflow handling
    const startY = 280;
    const lineSpacing = 35;
    let yPos = startY;

    // Draw light background for details
    page.drawRectangle({
      x: 35,
      y: 100,
      width: 330,
      height: 200,
      color: lightGray,
    });

    const details = [
      { label: "Name", value: userData.name },
      { label: "Registration ID", value: userData.registrationID },
      { label: "Email", value: userData.email },
      { label: "Date", value: "10 March 2025" },
      { label: "Venue", value: "Admin Seminar Hall 2" },
    ];

    details.forEach(({ label, value }) => {
      page.drawText(`${label}:`, {
        x: 50,
        y: yPos,
        size: 12,
        font: boldFont,
        color: black,
      });

      // Handle overflow for values
      drawTextWithOverflow(
        value,
        170,
        yPos,
        200, // Maximum width for value text
        12,
        font,
        black
      );

      yPos -= lineSpacing;
    });

    // Save PDF
    const pdfBytes = await pdfDoc.save();
    const filePath = path.join(tempDir, `${userData.registrationID}.pdf`);
    await writeFileAsync(filePath, pdfBytes);

    return filePath;
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
}

// POST route for form submission
router.post("/", async (req, res) => {
  try {
    const { name, mobile, email, department, interests, expectations } = req.body;
    if (!name || !mobile || !email || !department || interests.length === 0) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Check if the email already exists
    const existingUser = await Registration.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Generate a unique registration ID
    const registrationID = generateRegistrationID();

    // Save registration
    const newRegistration = new Registration({
      name,
      mobile,
      email,
      department,
      interests,
      expectations,
      registrationID,
    });
    await newRegistration.save();

    // Generate ID card PDF
    const pdfPath = await generateIDCard(newRegistration, "images/sreenidhi-logo.png", "images/ccc_logo.png");

    // Send Welcome Email with PDF attachment
    const mailOptions = {
      from: `"Cloud Community Club (C3)" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "OpenSession Ticket – Cloud Community Club C³ @ SNIST",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <title>OpenSession Ticket – Cloud Community Club ⁨C³ @ SNIST</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f4f4f4;
                    margin: 0;
                    padding: 0;
                }
                .container {
                    max-width: 600px;
                    margin: 20px auto;
                    background: #ffffff;
                    padding: 20px;
                    border-radius: 10px;
                    box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
                    text-align: center;
                    border-top: 5px solid #007bff;
                }
                h1 {
                    color: #007bff;
                    margin-bottom: 10px;
                }
                p {
                    font-size: 16px;
                    color: #333;
                    line-height: 1.6;
                }
                .highlight {
                    font-weight: bold;
                    color: #007bff;
                }
                .event-details {
                    background: #f0f8ff;
                    padding: 15px;
                    border-radius: 8px;
                    margin: 15px 0;
                }
                .event-details p {
                    margin: 5px 0;
                    font-size: 18px;
                }
                .cta-button {
                    display: inline-block;
                    background: #007bff;
                    color: #ffffff;
                    text-decoration: none;
                    padding: 12px 20px;
                    border-radius: 5px;
                    font-size: 18px;
                    margin-top: 10px;
                }
                .footer {
                    margin-top: 20px;
                    font-size: 14px;
                    color: #666;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🎓 Welcome to C³!</h1>
                <p>Hey <span class="highlight">${name}</span>,</p>
                <p>Thank you for registering for <strong>Cloud Community Club C³ OpenSession</strong> at SNIST!</p>

                <div class="event-details">
                    <p><strong>📍 Venue:</strong> Admin Seminar Hall - 2</p>
                    <p><strong>📅 Date:</strong> 10th March</p>
                    <p><strong>⏰ Time:</strong> 1:30 PM – 3:30 PM</p>
                    <p><strong>ID:</strong> <span class="highlight">${registrationID}</span></p>
                </div>

                <p>🎫 Your Ticket is attached to this email.</p>

                <h2>What's in Store?</h2>
                <p><strong>• Inspiring Talks</strong> – Gain insights from industry experts.</p>
                <p><strong>• Networking</strong> – Connect with like-minded tech enthusiasts.</p>
                <p><strong>• Hands-on Workshops</strong> – Explore cutting-edge technologies.</p>
                <p><strong>• Opportunities</strong> – Research, Open-Source, Hackathons & More!</p>

                <a href="https://chat.whatsapp.com/I0Z9iJ4O9veByzx20AofGY" class="cta-button">💬 Join Our WhatsApp Community</a>

                <p class="footer">
                    Looking forward to an exciting session with you!<br>
                    <strong>Best Regards,</strong><br>
                    <strong>Team C³</strong><br>
                    ✉️ <a href="mailto:pingus@cloudcommunityclub.in" style="color: #007bff;">pingus@cloudcommunityclub.in</a>
                </p>
            </div>
        </body>
        </html>
      `,
      attachments: [
        {
          filename: `C3_Membership_Card_${registrationID}.pdf`,
          path: pdfPath,
        },
      ],
    };

    await transporter.sendMail(mailOptions);

    // Delete temporary PDF file
    await unlinkAsync(pdfPath);

    res.status(201).json({ message: "success" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;