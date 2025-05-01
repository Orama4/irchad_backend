import express from "express";
import interventionRoutes from "./routes/interventionRoutes";
import deviceRoutes from "./routes/deviceRoutes";

const app = express();
app.use(express.json());

app.use("/api/interventions", interventionRoutes);
app.use("/api/devices", deviceRoutes);

export default app;
