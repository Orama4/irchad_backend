import express from 'express';
import dotenv from "dotenv";
import interventionRoutes from "./routes/interventionRoutes";
import deviceRoutes from "./routes/deviceRoutes";
import contactRoutes from './routes/contactRoutes';

const app = express();
dotenv.config();
const PORT = process.env.PORT || 3003;
app.use(express.json());


app.get('/', (req, res) => {
  res.send('Hello from maintenancier_service!');
});

app.use("/api/interventions", interventionRoutes);
app.use("/api/devices", deviceRoutes);
app.use('/api/contacts', contactRoutes);


app.listen(PORT, () => {
  console.log(`maintenancier_service is running on port ${PORT}`);
});
