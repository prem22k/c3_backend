import mongoose from "mongoose";

/**
 * Registrations 2026 Model
 * Stores data from join-us page form submissions
 * Collection: registrations-2026
 */
const Registration2026Schema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    mobile: {
        type: String,
        required: true
    },
    rollNumber: {
        type: String,
        required: true
    },
    department: {
        type: String,
        required: true
    },
    year: {
        type: String,
        required: true
    },
    interests: {
        type: [String],
        required: true
    },
    experience: {
        type: String
    },
    expectations: {
        type: String
    },
    referral: {
        type: String
    },
    // Email status tracking
    emailSent: {
        type: Boolean,
        default: false
    },
    emailSentAt: {
        type: Date
    },
    // Metadata
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update timestamp on save
Registration2026Schema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

export default mongoose.model('Registration2026', Registration2026Schema, 'registrations-2026');
