const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken } = require('../middlewares/auth');

// CA1 : La route publique de connexion (PAS de verifyToken ici, sinon on ne pourrait jamais se connecter)
router.post('/login', adminController.login);

// Route de test pour valider que le middleware bloque bien les intrus
router.get('/dashboard-test', verifyToken, (req, res) => {
    res.status(200).json({
        message: 'Bienvenue sur le tableau de bord sécurisé !',
        user_info: req.user
    });
});

// ==========================================
// ROUTES SÉCURISÉES - ISSUE 6
// ==========================================

// Gérer les jobistes (GET, POST, DELETE)
router.get('/jobistes', verifyToken, adminController.getAllJobistes);
router.post('/jobistes', verifyToken, adminController.addJobiste);
router.delete('/jobistes/:id', verifyToken, adminController.deleteJobiste);

// Assigner un badge à un jobiste précis (POST)
router.post('/jobistes/:user_id/badge', verifyToken, adminController.assignBadge);

module.exports = router;