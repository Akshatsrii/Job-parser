import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import companyRoutes from "./routes/companyRoutes.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/company", companyRoutes);

app.get("/", (req, res) => res.json({ message: "Job Portal API Running" }));

app.use((req, res) => res.status(404).json({ success: false, message: "Route not found" }));

export default app;