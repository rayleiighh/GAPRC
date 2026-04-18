const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken } = require('../middlewares/auth');

const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // Fenêtre de 15 minutes
    max: 5, // Bloque après 5 tentatives depuis la même adresse IP
    message: { error: "Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes." },
    standardHeaders: true, // Renvoie les infos de limite dans les headers HTTP
    legacyHeaders: false,
});

// CA1 : Route de login (Publique, MAIS protégée par le limiteur !)
router.post('/login', loginLimiter, adminController.login);
router.post('/forgot-password', loginLimiter, adminController.forgotPassword);
router.post('/reset-password', loginLimiter, adminController.resetPassword);

// CA2 : Routes d'administration (Protégées par JWT)
router.get('/jobistes', verifyToken, adminController.getAllJobistes);
router.post('/jobistes', verifyToken, adminController.addJobiste);
router.post('/jobistes/:id/badge', verifyToken, adminController.assignBadge);
router.delete('/jobistes/:id', verifyToken, adminController.deleteJobiste);
router.get('/audit', verifyToken, adminController.getAuditLogs);
router.post('/change-password', verifyToken, adminController.changePassword);

module.exports = router;