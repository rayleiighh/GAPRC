const express = require('express');
const http = require('http');           // Ajout pour Socket.io
const { Server } = require('socket.io'); // Ajout pour Socket.io
const path = require('path');           // Ajout pour les dossiers

const app = express();
const server = http.createServer(app);  // On attache Express à un serveur HTTP classique
const io = new Server(server);          // On attache Socket.io au serveur HTTP
const port = 3000;

app.use(express.json());

// 1. On dit à Express d'afficher la page web qui est dans le dossier "public"
app.use(express.static(path.join(__dirname, 'public')));

// Nos utilisateurs de test
const mockUsers = {
  "5eaece6": "Rayane", 
  "a74166": "Directeur"
};

// 2. On écoute quand une page web se connecte au serveur
io.on('connection', (socket) => {
  console.log('Une interface Web (Kiosque) vient de se connecter !');
});

// 3. La route du badge (Modifiée pour prévenir la page web)
app.post('/badge', (req, res) => {
  const uid = req.body.nfc_uid; 
  
  if (!uid) return res.status(400).json({ error: "Missing nfc_uid" });

  console.log(`\n[!] Scan détecté ! UID : ${uid}`);

  if (mockUsers[uid]) {
    console.log(`Utilisateur reconnu : ${mockUsers[uid]}`);
    
    io.emit('nouveau_scan', { status: 'succes', nom: mockUsers[uid] });
    
    res.status(200).json({ status: "known", user: mockUsers[uid] });
  } else {
    console.log(`❌ Badge inconnu dans le système`);
    
    // On prévient aussi la page web de l'erreur
    io.emit('nouveau_scan', { status: 'erreur' });
    
    res.status(404).json({ status: "unknown" });
  }
});

// Attention : c'est "server.listen" maintenant, plus "app.listen"
server.listen(port, '0.0.0.0', () => {
  console.log(`Serveur POC démarré sur http://localhost:${port}`);
});