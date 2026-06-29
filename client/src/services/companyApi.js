import axios from "axios";

const API = axios.create({ baseURL: "/api" });

export const getAllCompanies = () => API.get("/company");
export const getCompanyById = (id) => API.get(`/company/${id}`);