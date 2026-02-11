import mongoose from "mongoose";

/**
 * Recruitment Candidates Model
 * Stores data from recruitment page unlock modal
 * Collection: recruitment
 */
const RecruitmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        validate: {
            validator: function (email) {
                const domain = email.split('@')[1];
                // Accept any subdomain ending in .sreenidhi.edu.in or .shu.edu.in
                return domain && (domain.endsWith('sreenidhi.edu.in') || domain.endsWith('shu.edu.in'));
            },
            message: 'Email must be from sreenidhi.edu.in or shu.edu.in domain'
        }
    },
    mobile: {
        type: String,
        required: true
    },
    passingOutYear: {
        type: String,
        required: true
    },
    // Track which problem they unlocked
    problemUnlocked: {
        type: String,
        required: false
    },
    // Track submission status
    submittedSolution: {
        type: Boolean,
        default: false
    },
    // Metadata
    source: {
        type: String,
        default: 'Recruitment Page'
    },
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
RecruitmentSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

export default mongoose.model('Recruitment', RecruitmentSchema, 'recruitment');
