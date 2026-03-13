const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
    // Le token est généralement envoyé dans le header "Authorization: Bearer <token>"
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Accès refusé. Aucun token fourni.' });
    }

    try {
        // On vérifie que le token a bien été signé avec notre secret
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // On attache les infos décodées (id, role) à la requête pour les routes suivantes
        req.user = decoded; 
        
        // Le videur laisse passer la requête
        next(); 
    } catch (error) {
        return res.status(403).json({ error: 'Token invalide ou expiré.' });
    }
};