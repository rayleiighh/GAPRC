const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken } = require('../middlewares/auth');

// CA1 : La route publique de connexion
router.post('/login', adminController.login);

// Route de test pour valider que le middleware (CA3) bloque bien les intrus
router.get('/dashboard-test', verifyToken, (req, res) => {
    res.status(200).json({
        message: 'Bienvenue sur le tableau de bord sécurisé !',
        user_info: req.user // Affiche le contenu décodé du token (id, role)
    });
});

module.exports = router;