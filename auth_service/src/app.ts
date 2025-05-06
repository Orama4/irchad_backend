import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/routes";
import UsersRoutes from "./routes/usersRoutes";


dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || "3001", 10);

app.use(express.json());
app.use(cors());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", UsersRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});