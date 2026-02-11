import { Router } from "express";
import dotenv from "dotenv";
import Recruitment from "../models/recruitment.js";
import { requireApiKey } from "../middleware/auth.js";

dotenv.config();
const router = Router();

/**
 * GET /api/recruitment
 * Returns API information
 */
router.get("/", (req, res) => {
    res.status(200).json({
        message: "Recruitment API is working",
        instructions: "Please use POST method to unlock recruitment challenges",
        endpoints: {
            unlock: "POST /api/recruitment/unlock - Submit details to unlock challenges"
        }
    });
});

/**
 * POST /api/recruitment/unlock
 * Save candidate information from recruitment page
 * Protected with API key
 */
router.post("/unlock", requireApiKey, async (req, res) => {
    try {
        const { name, email, mobile, passingOutYear } = req.body;

        // Validate required fields
        if (!name || !email || !mobile || !passingOutYear) {
            return res.status(400).json({
                message: "error",
                error: "Name, email, mobile, and passing out year are required fields"
            });
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                message: "error",
                error: "Invalid email format"
            });
        }

        // Domain validation - accept any subdomain ending in .sreenidhi.edu.in or .shu.edu.in
        const emailDomain = email.toLowerCase().split('@')[1];

        if (!emailDomain || (!emailDomain.endsWith('sreenidhi.edu.in') && !emailDomain.endsWith('shu.edu.in'))) {
            return res.status(400).json({
                message: "error",
                error: "Only emails from sreenidhi.edu.in or shu.edu.in domains are accepted"
            });
        }

        // Save or update candidate data
        // Using upsert pattern to allow retries
        const candidateData = {
            name,
            email,
            mobile,
            passingOutYear,
            source: "Recruitment Page",
            updatedAt: new Date()
        };

        const candidate = await Recruitment.findOneAndUpdate(
            { email },
            candidateData,
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        console.log(`✅ Recruitment candidate saved: ${name} (${email})`);

        // Return success response
        return res.status(200).json({
            message: "success",
            data: {
                name,
                email,
                unlocked: true
            }
        });

    } catch (error) {
        console.error('Recruitment unlock error:', error);
        return res.status(500).json({
            message: "error",
            error: "An error occurred while processing your request"
        });
    }
});

export default router;
