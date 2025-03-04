import mongoose from "mongoose";

const RegistrationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    mobile: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    department: { type: String, required: true },
    interests: { type: [String], required: true },
    expectations: { type: String },
    registrationID: {type: String}
});

export default mongoose.model('Registration', RegistrationSchema);