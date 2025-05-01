import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import {userRoutes} from "./routes/userRoutes"; 
//const prisma = new PrismaClient();
import deviceRoutes from "./routes/deviceRoutes"; 
import { subscribe, publish } from "./utils/mqtt_client";


// Configuration des variables d'environnement
dotenv.config();

export const app = express();
const PORT = process.env.NODE_ENV === "test" ? 0 : 5001; 
// Middlewares
const PORT = process.env.NODE_ENV === "test" ? 0 : 5002;

// Enhanced CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:3000',
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept'
  ],
  credentials: true, // If using cookies/sessions
  optionsSuccessStatus: 200 // For legacy browsers
};

// Apply CORS middleware before other middleware
app.use(cors(corsOptions));

// Other middlewares
app.use(express.json());

// Routes
app.use("/users", userRoutes);
app.use("/devices", deviceRoutes);


// Démarrage contrôlé du serveur
export const server = app.listen(PORT, () => {
  console.log(`Stats service actif sur http://localhost:${PORT})`);
// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

export const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on("SIGINT", () => {
  server.close(() => {
    console.log("\nServer stopped gracefully");
    process.exit(0);
  });
});