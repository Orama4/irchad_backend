import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import {zoneRouter} from "./routes/zoneRoutes"
import {userRoutes} from "./routes/userRoutes"; 
//const prisma = new PrismaClient();
import deviceRoutes from "./routes/deviceRoutes"; 

// Configuration des variables d'environnement
dotenv.config();

export const app = express();
const port = process.env.PORT || 5001;

// Middlewares
app.use(express.json());
app.use(cors());

app.use("/users", userRoutes);


//Routes of devices service 
app.use("/devices", deviceRoutes);


//Routes of zones service 
app.use("/zones", zoneRouter);


// Démarrage contrôlé du serveur
export const server = app.listen(port, () => {
  console.log(`Stats service actif sur http://localhost:${port}`);
});

//export { app, server };
// Gestion propre de l'arrêt
process.on("SIGINT", () => {
  server.close(() => {
    console.log("\nSer veur arrêté proprement");
    process.exit(0);
  });
});
