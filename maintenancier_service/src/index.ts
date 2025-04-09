import express from 'express';

const app = express();
const PORT = 3003;

app.get('/', (req, res) => {
  res.send('Hello from maintenancier_service!');
});

app.listen(PORT, () => {
  console.log(`maintenancier_service is running on port ${PORT}`);
});
