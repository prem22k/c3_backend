import mongoose from "mongoose";

const registrationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  phone: {
    type: String,
    required: true,
  },
  rollNumber: {
    type: String,
    required: true,
  },
  branch: {
    type: String,
    required: true,
  },
  year: {
    type: String,
    required: true,
  },
  interests: {
    type: [String],
    required: true,
  },
  experience: {
    type: String,
  },
  expectations: {
    type: String,
  },
  referral: {
    type: String,
  },
  registrationID: {
    type: String,
    required: true,
    unique: true,
  },
  registrationDate: {
    type: Date,
    default: Date.now,
  },
});

const Registration = mongoose.model("Registration", registrationSchema);

export default Registration;