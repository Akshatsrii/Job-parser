import express from "express";
import {
  getAllCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
} from "../controllers/companyController.js";

const router = express.Router();

router.route("/").get(getAllCompanies).post(createCompany);
router.route("/:id").get(getCompanyById).put(updateCompany).delete(deleteCompany);

export default router;