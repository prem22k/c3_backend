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
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Define colors
    const black = rgb(0, 0, 0);
    const darkGray = rgb(0.2, 0.2, 0.2);
    const lightGray = rgb(0.95, 0.95, 0.95);
    const white = rgb(1, 1, 1);

    // Background with subtle gradient effect
    page.drawRectangle({
      x: 20,
      y: 20,
      width: 360,
      height: 510,
      color: white,
      borderColor: black,
      borderWidth: 2,
    });

    // Top black banner
    page.drawRectangle({
      x: 21,
      y: 430,
      width: 358,
      height: 99,
      color: black,
    });

    // Decorative elements
    page.drawRectangle({
      x: 21,
      y: 420,
      width: 358,
      height: 2,
      color: black,
    });

    // Add subtle background pattern for the details section
    page.drawRectangle({
      x: 35,
      y: 100,
      width: 330,
      height: 280,
      color: lightGray,
      borderColor: darkGray,
      borderWidth: 1,
    });

    // Logo positioning with improved spacing
    const maxLogoHeight = 70;
    const maxLogoWidth = 150;
    const topMargin = 460;
    const spacing = 40;

    // Load and draw logos (same calculation logic)
    const collegeLogoBytes = fs.readFileSync(collegeLogoPath);
    const clubLogoBytes = fs.readFileSync(clubLogoPath);
    const collegeLogo = await pdfDoc.embedPng(collegeLogoBytes);
    const clubLogo = await pdfDoc.embedPng(clubLogoBytes);

    const collegeLogoAspectRatio = collegeLogo.width / collegeLogo.height;
    const clubLogoAspectRatio = clubLogo.width / clubLogo.height;

    let collegeLogoWidth = maxLogoHeight * collegeLogoAspectRatio;
    let collegeLogoHeight = maxLogoHeight;
    if (collegeLogoWidth > maxLogoWidth) {
      collegeLogoWidth = maxLogoWidth;
      collegeLogoHeight = maxLogoWidth / collegeLogoAspectRatio;
    }

    let clubLogoWidth = maxLogoHeight * clubLogoAspectRatio;
    let clubLogoHeight = maxLogoHeight;
    if (clubLogoWidth > maxLogoWidth) {
      clubLogoWidth = maxLogoWidth;
      clubLogoHeight = maxLogoWidth / clubLogoAspectRatio;
    }

    const totalWidth = collegeLogoWidth + spacing + clubLogoWidth;
    const startX = (400 - totalWidth) / 2;

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

    // Title with improved typography
    page.drawText("Cloud Community Club (C3)", {
      x: 85,
      y: topMargin - 65,
      size: 20,
      font: boldFont,
      color: black,
    });

    page.drawText("Open Session Ticket", {
      x: 140,
      y: topMargin - 95,
      size: 16,
      font: boldFont,
      color: darkGray,
    });

    // Details section with improved layout
    const startY = topMargin - 150;
    const lineSpacing = 35;
    let yPos = startY;

    const details = [
      { label: "Name", value: userData.name },
      { label: "Registration ID", value: userData.registrationID },
      { label: "Email", value: userData.email },
      { label: "Date", value: "10 March 2025" },
      { label: "Venue", value: "Admin Seminar Hall 2" },
    ];

    details.forEach(({ label, value }) => {
      // Label background
      page.drawRectangle({
        x: 45,
        y: yPos - 5,
        width: 310,
        height: 25,
        color: white,
        borderColor: darkGray,
        borderWidth: 0.5,
      });

      page.drawText(`${label}:`, {
        x: 55,
        y: yPos,
        size: 12,
        font: boldFont,
        color: black,
      });

      page.drawText(value, {
        x: 180,
        y: yPos,
        size: 12,
        font,
        color: darkGray,
      });

      yPos -= lineSpacing;
    });

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