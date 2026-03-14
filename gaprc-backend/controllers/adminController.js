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

// ==========================================
// GESTION DES JOBISTES (ISSUE 6)
// ==========================================

// 1. Récupérer tous les jobistes et leurs badges (CA1)
exports.getAllJobistes = async (req, res) => {
    try {
        const query = `
            SELECT 
                u.id, 
                u.first_name, 
                u.last_name, 
                u.email, 
                u.created_at,
                b.nfc_uid,
                b.is_active
            FROM users u
            LEFT JOIN badges b ON u.id = b.user_id
            WHERE u.role = 'jobiste'
            ORDER BY u.created_at DESC;
        `;
        const { rows } = await pool.query(query);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Erreur getAllJobistes:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des jobistes' });
    }
};

// 2. Ajouter un nouveau jobiste (CA2)
exports.addJobiste = async (req, res) => {
    const { first_name, last_name, email } = req.body;

    if (!first_name || !last_name || !email) {
        return res.status(400).json({ error: 'Tous les champs sont requis' });
    }

    try {
        const query = `
            INSERT INTO users (first_name, last_name, email, role)
            VALUES ($1, $2, $3, 'jobiste')
            RETURNING id, first_name, last_name, email;
        `;
        const { rows } = await pool.query(query, [first_name, last_name, email]);
        res.status(201).json({ message: 'Jobiste ajouté avec succès', user: rows[0] });
    } catch (error) {
        if (error.code === '23505') { // Erreur de contrainte UNIQUE (email)
            return res.status(409).json({ error: 'Cet email est déjà utilisé' });
        }
        console.error('Erreur addJobiste:', error);
        res.status(500).json({ error: 'Erreur lors de l\'ajout du jobiste' });
    }
};

// 3. Assigner ou mettre à jour un badge RFID (CA3)
exports.assignBadge = async (req, res) => {
    const { user_id } = req.params;
    const { nfc_uid } = req.body;

    if (!nfc_uid) {
        return res.status(400).json({ error: 'L\'UID du badge est requis' });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // On supprime l'ancien badge du jobiste s'il en avait un
        await client.query('DELETE FROM badges WHERE user_id = $1', [user_id]);

        // On insère le nouveau badge
        const insertQuery = `
            INSERT INTO badges (nfc_uid, user_id, is_active)
            VALUES ($1, $2, TRUE)
            RETURNING *;
        `;
        const { rows } = await client.query(insertQuery, [nfc_uid, user_id]);

        await client.query('COMMIT');
        res.status(200).json({ message: 'Badge assigné avec succès', badge: rows[0] });
    } catch (error) {
        await client.query('ROLLBACK');
        if (error.code === '23505') { // L'UID du badge est UNIQUE
            return res.status(409).json({ error: 'Ce badge est déjà assigné à quelqu\'un d\'autre' });
        }
        console.error('Erreur assignBadge:', error);
        res.status(500).json({ error: 'Erreur lors de l\'assignation du badge' });
    } finally {
        client.release();
    }
};

// 4. Supprimer un jobiste (CA4)
exports.deleteJobiste = async (req, res) => {
    const { id } = req.params;

    try {
        // Le ON DELETE CASCADE dans la DB s'occupera de supprimer son badge et ses historiques !
        const query = 'DELETE FROM users WHERE id = $1 AND role = $2 RETURNING id';
        const { rowCount } = await pool.query(query, [id, 'jobiste']); // Sécurité: on s'assure qu'on ne supprime qu'un jobiste

        if (rowCount === 0) {
            return res.status(404).json({ error: 'Jobiste introuvable' });
        }

        res.status(200).json({ message: 'Jobiste supprimé avec succès' });
    } catch (error) {
        console.error('Erreur deleteJobiste:', error);
        res.status(500).json({ error: 'Erreur lors de la suppression' });
    }
};