import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { zoneRouter } from "./routes/zoneRoutes";
import { userRoutes } from "./routes/userRoutes";
//const prisma = new PrismaClient();
import deviceRoutes from "./routes/deviceRoutes";
import saleRouter from "./routes/saleRoutes";
import dashboardRoutes from "./routes/dashboardRoutes";
import reportRoutes from "./routes/reportRoutes";

// Configuration des variables d'environnement
dotenv.config();

export const app = express();
const PORT = process.env.NODE_ENV === "test" ? 0 : 5001;
// Middlewares
app.use(express.json());
app.use(cors());

app.use("/", dashboardRoutes);

app.use("/users", userRoutes);

// User profile routes

//Routes of devices service
app.use("/devices", deviceRoutes);

//Routes of zones service
app.use("/zones", zoneRouter);

app.use("/sales", saleRouter);

// Report routes
app.use("/reports", reportRoutes);

// Route de test
app.get("/getSales", (req, res) => {
  res.json({
    sales: 15000,
    message: "Données de vente stables",
  });
});

// Démarrage contrôlé du serveur
export const server = app.listen(PORT, () => {
  console.log(`Stats service actif sur http://localhost:${PORT}`);
});

//export { app, server };
// Gestion propre de l'arrêt
process.on("SIGINT", () => {
  server.close(() => {
    console.log("\nSer veur arrêté proprement");
    process.exit(0);
  });
});
