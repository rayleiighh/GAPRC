const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./config/db');

const app = express();
const port = process.env.PORT || 3000;

// CA2 : Configuration du middleware CORS (autorise la future PWA)
app.use(cors());
// Permet à Express de lire le JSON envoyé dans le body des requêtes (pour l'ESP32)
app.use(express.json());

// CA4 : Route de test (Health Check)
app.get('/api/health', async (req, res) => {
  try {
    // On fait une mini-requête à la base pour vérifier qu'elle répond
    const result = await db.query('SELECT NOW() AS current_time');
    
    res.status(200).json({
      status: 'OK',
      message: 'Serveur Express opérationnel 🚀',
      database: 'Connectée ✅',
      db_time: result.rows[0].current_time
    });
  } catch (error) {
    console.error('❌ Erreur DB sur /api/health:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Erreur de connexion à la base de données',
      error: error.message
    });
  }
});

// CA1 : Le serveur démarre et écoute sur le port défini
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Serveur API démarré et en écoute sur http://localhost:${port}`);
});