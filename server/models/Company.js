import mongoose from "mongoose";

const companySchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true, trim: true },
    logo: { type: String, default: "" },
    location: { type: String, required: true },
    language: { type: String, default: "" },
    workingHours: { type: String, default: "9 AM - 6 PM" },
    website: { type: String, default: "" },
    description: { type: String, default: "" },
    hiringFor: { type: [String], default: [] },
    experience: { type: String, default: "0-1 years" },
    salary: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Company", companySchema);