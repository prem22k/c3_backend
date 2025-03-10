import mongoose from "mongoose";

const NewMembersSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    mobile: { type: String, required: true },
    rollNumber: { type: String, required: true },
    department: { type: String, required: true },
    year: { type: String, required: true },
    interests: { type: [String], required: true },
    experience: { type: String },
    expectations: { type: String },
    referral: { type: String },

});

export default mongoose.model('NewMembers', NewMembersSchema);