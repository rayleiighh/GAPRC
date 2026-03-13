const { Pool } = require('pg');
require('dotenv').config(); // Charge les variables du .env

// CA3 : Connexion via les variables d'environnement
const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.DB_HOST,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: process.env.DB_PORT,
});

// Petit log pour confirmer que le pool est prêt
pool.on('connect', () => {
  console.log('Pool de connexion PostgreSQL prêt');
});

pool.on('error', (err) => {
  console.error('Erreur inattendue sur le client PostgreSQL', err);
  process.exit(-1);
});

// On exporte le pool pour l'utiliser dans nos futurs controllers
module.exports = pool;