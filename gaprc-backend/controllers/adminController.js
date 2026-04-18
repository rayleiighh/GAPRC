const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { logAudit } = require('../utils/audit');


const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

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
    const { id: user_id } = req.params;
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

        await logAudit(
            'ASSIGN_BADGE',
            'user',
            user_id,
            req.user?.id ? `admin:${req.user.id}` : 'admin:unknown',
            { nfc_uid },
            client
        );

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
        const userQuery = `
            SELECT id, first_name, last_name, email
            FROM users
            WHERE id = $1 AND role = $2
        `;
        const userResult = await pool.query(userQuery, [id, 'jobiste']);

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'Jobiste introuvable' });
        }

        const targetUser = userResult.rows[0];

        await logAudit(
            'DELETE_USER',
            'user',
            targetUser.id,
            req.user?.id ? `admin:${req.user.id}` : 'admin:unknown',
            {
                name: `${targetUser.first_name} ${targetUser.last_name}`,
                email: targetUser.email,
            }
        );

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

// POST /api/admin/forgot-password
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: "L'email est requis." });
    }

    try {
        // 1. Vérifier si l'utilisateur existe
        const userQuery = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        console.log("🔍 Résultat de la recherche en DB :", userQuery.rows.length, "utilisateur(s) trouvé(s).");

        // 2. SÉCURITÉ ANTI-ÉNUMÉRATION : On répond un message générique même si l'email n'existe pas
        if (userQuery.rows.length === 0) {
            return res.status(200).json({ message: "Si cette adresse est liée à un compte, un email a été envoyé." });
        }

        const user = userQuery.rows[0];

        // 3. GÉNÉRATION CRYPTOGRAPHIQUE : 32 octets aléatoires (imprévisibles)
        const resetToken = crypto.randomBytes(32).toString('hex');

        // 4. HACHAGE (SHA-256) : On ne stocke jamais le token en clair dans la DB
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        // 5. EXPIRATION : Valide pour 15 minutes
        const tokenExpires = new Date(Date.now() + 15 * 60 * 1000);

        // 6. Enregistrement dans la base de données
        await pool.query(
            'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
            [hashedToken, tokenExpires, user.id]
        );

        // 7. Création de l'URL contenant le token EN CLAIR (vers le frontend React)
        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:4173';
        const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

        // 8. Envoi de l'email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'GAPRC - Réinitialisation de votre mot de passe',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                    <h2 style="color: #333;">Demande de réinitialisation</h2>
                    <p>Vous avez demandé à réinitialiser votre mot de passe pour le panneau d'administration GAPRC.</p>
                    <p>Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe. <strong>Ce lien expirera dans 15 minutes.</strong></p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Réinitialiser mon mot de passe</a>
                    </div>
                    <p style="color: #666; font-size: 14px;">Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email en toute sécurité.</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ message: "Si cette adresse est liée à un compte, un email a été envoyé." });

    } catch (error) {
        console.error("❌ Erreur forgotPassword:", error);
        res.status(500).json({ error: "Erreur lors de la demande de réinitialisation." });
    }
};

// POST /api/admin/reset-password
exports.resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        return res.status(400).json({ error: "Le jeton et le nouveau mot de passe sont requis." });
    }

    try {
        // 1. Hacher le token reçu depuis l'URL (pour pouvoir le comparer avec la DB)
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        // 2. Chercher l'utilisateur avec ce token ET vérifier que l'expiration est dans le futur (> NOW())
        const query = 'SELECT id FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()';
        const { rows } = await pool.query(query, [hashedToken]);

        if (rows.length === 0) {
            return res.status(400).json({ error: "Ce lien de réinitialisation est invalide ou a expiré." });
        }

        const userId = rows[0].id;

        // 3. Hacher le NOUVEAU mot de passe avec bcrypt
        const salt = await bcrypt.genSalt(10);
        const newPasswordHash = await bcrypt.hash(newPassword, salt);

        // 4. Mettre à jour le mot de passe ET détruire le token (BURN AFTER READING)
        await pool.query(
            'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2',
            [newPasswordHash, userId]
        );

        res.status(200).json({ message: "Votre mot de passe a été réinitialisé avec succès." });

    } catch (error) {
        console.error("❌ Erreur resetPassword:", error);
        res.status(500).json({ error: "Erreur lors de la réinitialisation du mot de passe." });
    }
};

// POST /api/admin/change-password
exports.changePassword = async (req, res) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const adminId = req.user?.id;

    if (!adminId) {
        return res.status(401).json({ error: "Accès refusé." });
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({ error: "Tous les champs sont requis." });
    }

    if (newPassword !== confirmPassword) {
        return res.status(400).json({ error: "Les nouveaux mots de passe ne correspondent pas." });
    }

    if (newPassword.length < 8) {
        return res.status(400).json({ error: "Le nouveau mot de passe doit contenir au moins 8 caractères." });
    }

    try {
        const { rows } = await pool.query(
            'SELECT id, email, password_hash FROM users WHERE id = $1 AND role = $2',
            [adminId, 'admin']
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: "Compte admin introuvable." });
        }

        const admin = rows[0];
        const validCurrentPassword = await bcrypt.compare(currentPassword, admin.password_hash || '');

        if (!validCurrentPassword) {
            return res.status(401).json({ error: "Mot de passe actuel incorrect." });
        }

        const isSamePassword = await bcrypt.compare(newPassword, admin.password_hash || '');
        if (isSamePassword) {
            return res.status(400).json({ error: "Le nouveau mot de passe doit être différent de l'ancien." });
        }

        const salt = await bcrypt.genSalt(10);
        const newPasswordHash = await bcrypt.hash(newPassword, salt);

        await pool.query(
            'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2',
            [newPasswordHash, adminId]
        );

        await logAudit(
            'CHANGE_PASSWORD',
            'user',
            adminId,
            `admin:${adminId}`,
            { email: admin.email }
        );

        res.status(200).json({ message: "Mot de passe mis à jour avec succès." });
    } catch (error) {
        console.error('❌ Erreur changePassword:', error);
        res.status(500).json({ error: "Erreur lors du changement de mot de passe." });
    }
};

// GET /api/admin/audit
exports.getAuditLogs = async (req, res) => {
    try {
        const parsedLimit = Number.parseInt(req.query.limit, 10);
        const parsedOffset = Number.parseInt(req.query.offset, 10);
        const limit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 200) : 50;
        const offset = Number.isFinite(parsedOffset) ? Math.max(parsedOffset, 0) : 0;

        const result = await pool.query(
            'SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT $1 OFFSET $2',
            [limit, offset]
        );
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Erreur fetch audit :', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des logs.' });
    }
};