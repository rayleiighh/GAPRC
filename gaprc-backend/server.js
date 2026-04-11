const express = require('express');
const cors = require('cors');
require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io'); 

const db = require('./config/db');
const scanRoutes = require('./routes/scanRoutes');
const shiftRoutes = require('./routes/shiftRoutes');
const transactionsRoutes = require('./routes/transactionsRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const port = process.env.PORT || 3000;

// 🔴 CONFIGURATION DU SERVEUR HTTP ET SOCKET.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:4173', // Autorise le frontend à se connecter
    methods: ["GET", "POST"],
    credentials: true
  }
});

// CA2 : Configuration du middleware CORS (autorise la future PWA)
app.use(cors());
app.use(express.json());

// 🔴 INJECTION DE 'io' DANS LES REQUÊTES POUR L'UTILISER DANS LES CONTRÔLEURS
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Écoute des connexions WebSocket
io.on('connection', (socket) => {
  console.log(`🔌 Nouvelle connexion Kiosque (ID: ${socket.id})`);
  
  socket.on('disconnect', () => {
    console.log(`🔌 Kiosque déconnecté (ID: ${socket.id})`);
  });
});

app.use('/api/admin', adminRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/scan', scanRoutes);
app.use('/api/shifts', shiftRoutes);

// CA4 : Route de test (Health Check)
app.get('/api/health', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW() AS current_time');
    res.status(200).json({ status: 'OK', database: 'Connectée ✅', db_time: result.rows[0].current_time });
  } catch (error) {
    res.status(500).json({ status: 'ERROR', error: error.message });
  }
});

// CA1 : Le serveur démarre (ATTENTION: On utilise server.listen et pas app.listen)
server.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Serveur API & WebSockets démarré sur http://localhost:${port}`);
});