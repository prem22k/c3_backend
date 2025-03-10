import { Router } from "express";
import dotenv from "dotenv";
import Registration from "../models/registration.js";
import NewMembers from "../models/newMembers.js";
dotenv.config();
const router = Router();

// Function to generate a unique registration ID
const generateRegistrationID = () => {
  return "C3-" + Math.floor(100000 + Math.random() * 900000); // Example: C3-123456
};

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
      return res.status(400).json({ error: "All required fields must be provided" });
    }

    // Check if the email already exists
    const existingUser = await NewMembers.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
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

    // Return success response
    res.status(201).json({ 
      message: "success", 
      //registrationID: registrationID 
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;