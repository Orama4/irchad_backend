import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import zoneRoutes from "./routes/zoneRoutes"; 


import { PrismaClient  } from "@prisma/client";

const prisma = new PrismaClient();
// Configuration des variables d'environnement
dotenv.config();

const app = express();
const port = process.env.PORT || 5001;

// Middlewares
app.use(express.json());
app.use(cors());

// Route de test
app.get("/getSales", (req, res) => {
  res.json({
    sales: 15000,
    message: "Données de vente stables"
  });
});


//Routes of zones service 
app.use("/api", zoneRoutes);


// Démarrage contrôlé du serveur
const server = app.listen(port, () => {
  console.log(`Stats service actif sur http://localhost:${port}`);
});

// Gestion propre de l'arrêt
process.on("SIGINT", () => {
  server.close(() => {
    console.log("\nSer veur arrêté proprement");
    process.exit(0);
  });
});