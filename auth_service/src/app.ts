import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/routes";
import cors from "cors"
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(cors())
// Routess
app.use("/api/auth", authRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
