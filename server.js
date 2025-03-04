import dotenv from 'dotenv';
dotenv.config();
import express from "express";
import { connect } from "mongoose";
import cors from "cors";
import registerRoute from "./routes/register.js"; // Added .js extension

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use("/api/register", registerRoute);

// Connect to MongoDB
connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error(err));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
