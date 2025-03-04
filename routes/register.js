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
import { mkdir } from 'fs/promises';

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

// After creating temp directory
const imagesDir = path.join(__dirname, "../public/images");
if (!fs.existsSync(imagesDir)) {
  await mkdir(imagesDir, { recursive: true });
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
    // Verify logo paths
    if (!fs.existsSync(collegeLogoPath)) {
      throw new Error(`College logo not found. Please contact support.`);
    }
    if (!fs.existsSync(clubLogoPath)) {
      throw new Error(`Club logo not found. Please contact support.`);
    }

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
  let pdfPath = null;
  try {
    const { name, mobile, email, department, interests, expectations } = req.body;
    
    // More specific validation messages
    if (!name) return res.status(400).json({ error: "Name is required" });
    if (!mobile) return res.status(400).json({ error: "Mobile number is required" });
    if (!email) return res.status(400).json({ error: "Email is required" });
    if (!department) return res.status(400).json({ error: "Department is required" });
    if (!interests || interests.length === 0) {
      return res.status(400).json({ error: "Please select at least one interest" });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Please enter a valid email address" });
    }

    // Validate mobile number (assuming Indian format)
    const mobileRegex = /^[6-9]\d{9}$/;
    if (!mobileRegex.test(mobile)) {
      return res.status(400).json({ error: "Please enter a valid 10-digit mobile number" });
    }

    // Check if the email or mobile already exists
    const existingUser = await Registration.findOne({ 
      $or: [
        { email: email.toLowerCase() }, 
        { mobile: mobile }
      ]
    });

    if (existingUser) {
      if (existingUser.email.toLowerCase() === email.toLowerCase()) {
        return res.status(400).json({ 
          error: "This email is already registered! If you need help, please contact us at pingus@cloudcommunityclub.in",
          registrationID: existingUser.registrationID 
        });
      }
      if (existingUser.mobile === mobile) {
        return res.status(400).json({ 
          error: "This mobile number is already registered! If you need help, please contact us at pingus@cloudcommunityclub.in",
          registrationID: existingUser.registrationID 
        });
      }
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

    // Generate ID card PDF with better error handling
    try {
      pdfPath = await generateIDCard(
        newRegistration,
        path.join(__dirname, "../public/images/sreenidhi-logo.png"),
        path.join(__dirname, "../public/images/ccc_logo.png")
      );
    } catch (pdfError) {
      console.error("PDF Generation Error:", pdfError);
      throw new Error("Unable to generate ticket. Please try again later.");
    }

    // Send Welcome Email with better error handling
    try {
      const sendMailPromise = new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            reject(error);
          } else {
            resolve(info);
          }
        });
      });

      await Promise.race([
        sendMailPromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Email sending timed out')), 30000)
        )
      ]);
    } catch (emailError) {
      console.error("Email Error:", emailError);
      throw new Error("Registration successful but unable to send email. Please contact support.");
    }

    // Cleanup and response
    if (pdfPath && fs.existsSync(pdfPath)) {
      try {
        await unlinkAsync(pdfPath);
      } catch (cleanupError) {
        console.error("Cleanup Error:", cleanupError);
      }
    }

    res.status(201).json({ 
      message: "success",
      registrationID: registrationID 
    });

  } catch (error) {
    console.error("Main Error:", error);
    
    // Cleanup on error
    if (pdfPath && fs.existsSync(pdfPath)) {
      try {
        await unlinkAsync(pdfPath);
      } catch (cleanupError) {
        console.error("Cleanup Error:", cleanupError);
      }
    }

    // Send appropriate error message to client
    res.status(500).json({ 
      error: error.message || "Unable to complete registration. Please try again later.",
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

export default router;