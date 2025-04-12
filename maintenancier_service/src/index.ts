import express from 'express';
import interventionRoutes from "./routes/interventionRoutes";
import deviceRoutes from "./routes/deviceRoutes";
const app = express();
const PORT = 3003;

app.get('/', (req, res) => {
  res.send('Hello from maintenancier_service!');
});
app.use(express.json());

app.use("/api/interventions", interventionRoutes);
app.use("/api/devices", deviceRoutes);


app.listen(PORT, () => {
  console.log(`maintenancier_service is running on port ${PORT}`);
});
