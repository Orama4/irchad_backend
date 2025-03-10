import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import dashboardRoutes from "./routes/dashboardRoutes"; 

// Configuration des variables d'environnement
dotenv.config();

const app = express();
const port = process.env.PORT || 5001;

// Middlewares
app.use(express.json());
app.use(cors());


app.use("/api", dashboardRoutes);

// Démarrage contrôlé du serveur
const server = app.listen(port, () => {
  console.log(`Stats service actif sur http://localhost:${port}`);
});

export { app, server };

// Gestion propre de l'arrêt
process.on("SIGINT", () => {
  server.close(() => {
    console.log("\nSer veur arrêté proprement");
    process.exit(0);
  });
});