import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import {userRoutes} from "./routes/userRoutes"; 
//const prisma = new PrismaClient();
import deviceRoutes from "./routes/deviceRoutes"; 


// Configuration des variables d'environnement
dotenv.config();

export const app = express();
const PORT = process.env.NODE_ENV === "test" ? 0 : 5002; 
// Middlewares
app.use(express.json());
app.use(cors());

//Routes of users 
app.use("/users", userRoutes);


//Routes of devices service 
app.use("/devices", deviceRoutes);




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
