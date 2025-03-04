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
    const blue = rgb(0.29, 0.53, 0.91);
    const black = rgb(0, 0, 0);
    const gray = rgb(0.8, 0.8, 0.8);

    // Load logos
    const collegeLogoBytes = fs.readFileSync(collegeLogoPath);
    const clubLogoBytes = fs.readFileSync(clubLogoPath);
    const collegeLogo = await pdfDoc.embedPng(collegeLogoBytes);
    const clubLogo = await pdfDoc.embedPng(clubLogoBytes);

    // Draw background border
    page.drawRectangle({
      x: 20,
      y: 20,
      width: 360,
      height: 510,
      borderColor: blue,
      borderWidth: 2,
    });

    // Add logos with adjusted positioning
    const logoWidth = 100;
    const logoHeight = 100;
    
    // Center both logos at the top
    page.drawImage(collegeLogo, {
      x: 60,
      y: 430,
      width: logoWidth,
      height: logoHeight,
    });

    page.drawImage(clubLogo, {
      x: 240,
      y: 430,
      width: logoWidth,
      height: logoHeight,
    });

    // Add title (moved down)
    page.drawText("Cloud Community Club (C3)", {
      x: 100,
      y: 380,
      size: 18,
      font: boldFont,
      color: blue,
    });

    page.drawText("Open Session Ticket", {
      x: 140,
      y: 350,
      size: 14,
      font,
      color: black,
    });

    // Add user details
    const startX = 50;
    let yPos = 300;
    const lineSpacing = 30;

    const details = [
      { label: "Name", value: userData.name },
      { label: "Registration ID", value: userData.registrationID },
      { label: "Email", value: userData.email },
      { label: "Date", value: "10 March 2025" },
      { label: "Venue", value: "Admin Seminar Hall 1" },
    ];

    details.forEach(({ label, value }) => {
      page.drawText(`${label}:`, { x: startX, y: yPos, size: 12, font: boldFont, color: black });
      page.drawText(value, { x: startX + 120, y: yPos, size: 12, font, color: black });
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
      subject: "🎉 Welcome to Cloud Community Club (C3)!",
      html: `
        <p>Hey <strong>${name}</strong>,</p>
        <p>Welcome to the <strong>Cloud Community Club (C3)</strong> – where innovation meets community! 🌍✨</p>
        
        <h3>🆔 Your Registration Details:</h3>
        <p><strong>✔ Name:</strong> ${name}</p>
        <p><strong>✔ Registration ID:</strong> ${registrationID}</p>
        <p>📎 <strong>Attached:</strong> Your official C3 Membership ID Card 🎉</p>
        
        <h3>💬 Join Our Community!</h3>
        <p>Connect with fellow members and stay updated:</p>
        <p>👉 <a href="https://chat.whatsapp.com/I0Z9iJ4O9veByzx20AofGY">Join our WhatsApp Community</a></p>
        
        <p>Looking forward to seeing you at the session!</p>
        
        <p>Best regards,<br>
        <strong>Team C3</strong></p>
        <p>📧 <a href="mailto:pingus@cloudcommunityclub.in">pingus@cloudcommunityclub.in</a></p>
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