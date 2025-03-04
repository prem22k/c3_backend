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
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([400, 550]);

    // Embed fonts
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Define modern color palette
    const black = rgb(0.12, 0.12, 0.12);
    const white = rgb(1, 1, 1);
    const gray = rgb(0.95, 0.95, 0.95);
    const darkGray = rgb(0.3, 0.3, 0.3);

    // Load logos first
    const collegeLogoBytes = fs.readFileSync(collegeLogoPath);
    const clubLogoBytes = fs.readFileSync(clubLogoPath);
    const collegeLogo = await pdfDoc.embedPng(collegeLogoBytes);
    const clubLogo = await pdfDoc.embedPng(clubLogoBytes);

    // Draw modern background with layers
    // Main black background
    page.drawRectangle({
      x: 20,
      y: 20,
      width: 360,
      height: 510,
      color: black,
    });

    // Accent rectangle on the left
    page.drawRectangle({
      x: 20,
      y: 20,
      width: 10,
      height: 510,
      color: darkGray,
    });

    // White content area
    page.drawRectangle({
      x: 35,
      y: 35,
      width: 330,
      height: 480,
      color: white,
    });

    // Black header area for logos
    page.drawRectangle({
      x: 35,
      y: 425,
      width: 330,
      height: 90,
      color: black,
    });

    // Calculate and draw logos
    const maxLogoHeight = 65;
    const maxLogoWidth = 130;
    
    // Calculate dimensions for logos
    let collegeLogoWidth = maxLogoHeight * (collegeLogo.width / collegeLogo.height);
    let collegeLogoHeight = maxLogoHeight;
    if (collegeLogoWidth > maxLogoWidth) {
      collegeLogoWidth = maxLogoWidth;
      collegeLogoHeight = maxLogoWidth / (collegeLogo.width / collegeLogo.height);
    }

    let clubLogoWidth = maxLogoHeight * (clubLogo.width / clubLogo.height);
    let clubLogoHeight = maxLogoHeight;
    if (clubLogoWidth > maxLogoWidth) {
      clubLogoWidth = maxLogoWidth;
      clubLogoHeight = maxLogoWidth / (clubLogo.width / clubLogo.height);
    }

    // Position logos
    const topMargin = 435;
    const spacing = 40;
    const totalWidth = collegeLogoWidth + spacing + clubLogoWidth;
    const startX = (400 - totalWidth) / 2;

    // Draw logos on black background
    page.drawImage(collegeLogo, {
      x: startX,
      y: topMargin,
      width: collegeLogoWidth,
      height: collegeLogoHeight,
    });

    page.drawImage(clubLogo, {
      x: startX + collegeLogoWidth + spacing,
      y: topMargin,
      width: clubLogoWidth,
      height: clubLogoHeight,
    });

    // Add modern title design
    page.drawRectangle({
      x: 55,
      y: 375,
      width: 290,
      height: 40,
      color: gray,
    });

    page.drawText("Cloud Community Club (C3)", {
      x: 70,
      y: 388,
      size: 18,
      font: boldFont,
      color: black,
    });

    // Ticket type with minimal design
    page.drawText("OPEN SESSION TICKET", {
      x: 125,
      y: 350,
      size: 14,
      font: boldFont,
      color: darkGray,
    });

    // User details with modern layout
    const startY = 310;
    const lineSpacing = 45;
    let yPos = startY;

    const details = [
      { label: "Name", value: userData.name },
      { label: "Registration ID", value: userData.registrationID },
      { label: "Email", value: userData.email },
      { label: "Date", value: "10 March 2025" },
      { label: "Venue", value: "Admin Seminar Hall 2" },
    ];

    details.forEach(({ label, value }) => {
      // Label with minimal design
      page.drawText(label.toUpperCase(), {
        x: 55,
        y: yPos,
        size: 10,
        font: boldFont,
        color: darkGray,
      });

      // Value with larger, bold text
      page.drawText(value, {
        x: 55,
        y: yPos - 20,
        size: 12,
        font: boldFont,
        color: black,
      });

      // Subtle separator line
      page.drawLine({
        start: { x: 55, y: yPos - 25 },
        end: { x: 345, y: yPos - 25 },
        thickness: 0.5,
        color: gray,
      });

      yPos -= lineSpacing;
    });

    // Modern footer design
    page.drawRectangle({
      x: 35,
      y: 35,
      width: 330,
      height: 30,
      color: gray,
    });

    page.drawText("Valid for one-time entry only", {
      x: 125,
      y: 47,
      size: 10,
      font: boldFont,
      color: darkGray,
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
      subject: "🎟️ OpenSession Ticket – Cloud Community Club C³ @ SNIST",
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
                <h1>🎟️ Welcome to ⁨C³!</h1>
                <p>Hey <span class="highlight">${name}</span>,</p>
                <p>Thank you for registering for <strong>Cloud Community Club C³ OpenSession</strong> at SNIST! 🚀</p>

                <div class="event-details">
                    <p><strong>📍 Venue:</strong> Admin Seminar Hall - 2</p>
                    <p><strong>📅 Date:</strong> 10th March</p>
                    <p><strong>⏰ Time:</strong> 1:30 PM – 3:30 PM</p>
                    <p><strong>🆔 Registration ID:</strong> <span class="highlight">${registrationID}</span></p>
                </div>

                <p>📎 Your Ticket is attached to this email.</p>

                <h2>🔥 What's in Store?</h2>
                <p>✔️ <strong>Inspiring Talks</strong> – Gain insights from industry experts.</p>
                <p>✔️ <strong>Networking</strong> – Connect with like-minded tech enthusiasts.</p>
                <p>✔️ <strong>Hands-on Workshops</strong> – Explore cutting-edge technologies.</p>
                <p>✔️ <strong>Opportunities</strong> – Research, Open-Source, Hackathons & More!</p>

                <a href="https://chat.whatsapp.com/I0Z9iJ4O9veByzx20AofGY" class="cta-button">Join Our WhatsApp Community</a>

                <p class="footer">
                    Looking forward to an exciting session with you! 🎯 <br>
                    <strong>Best Regards,</strong><br>
                    <strong>Team C³</strong> <br>
                    📧 <a href="mailto:pingus@cloudcommunityclub.in" style="color: #007bff;">pingus@cloudcommunityclub.in</a>
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