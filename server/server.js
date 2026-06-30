require("dotenv").config();

const app = require("./app");

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log("Gemini Key:", process.env.GEMINI_API_KEY ? "Loaded ✅" : "Not Loaded ❌");
});