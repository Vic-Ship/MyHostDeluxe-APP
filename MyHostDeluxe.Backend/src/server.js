const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware básico
app.use(cors());
app.use(express.json());

// Ruta de health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'MyHostDeluxe Backend funcionando',
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'MyHostDeluxe API',
    version: '1.0.0',
    endpoints: ['/api/health']
  });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(` Servidor ejecutándose en puerto ${PORT}`);
  console.log(` Health check: http://localhost:${PORT}/api/health`);
});