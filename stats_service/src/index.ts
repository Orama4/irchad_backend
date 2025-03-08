import express from "express";
import cors from "cors";
import dotenv from "dotenv";

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

// Démarrage contrôlé du serveur
const server = app.listen(port, () => {
  console.log(`✅ Stats service actif sur http://localhost:${port}`);
});

// Gestion propre de l'arrêt
process.on("SIGINT", () => {
  server.close(() => {
    console.log("\n🔴 Serveur arrêté proprement");
    process.exit(0);
  });
});