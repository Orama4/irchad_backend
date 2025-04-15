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
const PORT = process.env.NODE_ENV === "test" ? 0 : 5002; 
// Middlewares
app.use(express.json());
app.use(cors());

//Routes of users 
app.use("/users", userRoutes);


//Routes of devices service 
app.use("/devices", deviceRoutes);



const REQUEST_TOPIC = "topic/request";
const RESPONSE_TOPIC = "topic/response";

// Subscribe to topic
subscribe(REQUEST_TOPIC, (payload) => {
  console.log("📥 Received from topic/request:", payload);

});


publish(RESPONSE_TOPIC, { message: "Hello from Node.js!" });



// Démarrage contrôlé du serveur
export const server = app.listen(PORT, () => {
  console.log(`Stats service actif sur http://localhost:${PORT})`);
});

//export { app, server };
// Gestion propre de l'arrêt
process.on("SIGINT", () => {
  server.close(() => {
    console.log("\nSer veur arrêté proprement");
    process.exit(0);
  });
});