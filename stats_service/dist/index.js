"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const zoneRoutes_1 = __importDefault(require("./routes/zoneRoutes"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Configuration des variables d'environnement
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 5001;
// Middlewares
app.use(express_1.default.json());
app.use((0, cors_1.default)());
// Route de test
app.get("/getSales", (req, res) => {
    res.json({
        sales: 15000,
        message: "Données de vente stables"
    });
});
//Routes of devices service 
app.use("/api", zoneRoutes_1.default);
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
