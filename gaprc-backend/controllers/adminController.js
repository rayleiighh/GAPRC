const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// POST /api/admin/login
exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Chercher l'utilisateur par son email ET vérifier que c'est bien un admin
        const query = 'SELECT * FROM users WHERE email = $1 AND role = $2';
        const { rows } = await pool.query(query, [email, 'admin']);

        if (rows.length === 0) {
            return res.status(401).json({ error: 'Email incorrect ou accès refusé (non-admin).' });
        }

        const admin = rows[0];

        // CA1 : Comparer le mot de passe fourni avec le hash (bcrypt)
        const validPassword = await bcrypt.compare(password, admin.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Mot de passe incorrect.' });
        }

        // CA2 : Générer le JWT (uniquement avec l'ID et le rôle, PAS le mot de passe)
        const payload = {
            id: admin.id,
            role: admin.role
        };

        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '8h' } // Durée de validité de 8 heures
        );

        // Réponse en cas de succès
        res.status(200).json({
            message: 'Connexion réussie',
            token: token,
            admin: {
                id: admin.id,
                first_name: admin.first_name,
                last_name: admin.last_name,
                email: admin.email
            }
        });

    } catch (error) {
        console.error('Erreur Login Admin:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
};