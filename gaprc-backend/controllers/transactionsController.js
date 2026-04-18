const pool = require('../config/db'); // Assure-toi que le chemin vers ta config DB est bon

// POST /api/transactions
// Supporte l'Offline-First : vérifie le local_id pour éviter les doublons à la reconnexion
exports.addTransaction = async (req, res) => {
    const { shift_id, client_name, sport, duration, amount_cash, amount_card, local_id } = req.body;

    const parsedShiftId = Number.parseInt(shift_id, 10);
    const parsedCash = Number(amount_cash);
    const parsedCard = Number(amount_card);

    if (!Number.isInteger(parsedShiftId) || parsedShiftId <= 0) {
        return res.status(400).json({ error: 'shift_id invalide' });
    }

    if (!client_name || !sport || !duration) {
        return res.status(400).json({ error: 'client_name, sport et duration sont requis' });
    }

    if (!Number.isFinite(parsedCash) || parsedCash < 0 || !Number.isFinite(parsedCard) || parsedCard < 0) {
        return res.status(400).json({ error: 'Montants invalides (cash/carte)' });
    }

    try {
        // 1. Vérifier si la transaction existe déjà (grâce au local_id généré hors-ligne)
        if (local_id) {
            const checkQuery = 'SELECT id FROM shift_transactions WHERE local_id = $1';
            const { rows } = await pool.query(checkQuery, [local_id]);
            
            if (rows.length > 0) {
                // Si elle existe, on renvoie un succès (idempotence) sans rien insérer
                return res.status(200).json({ 
                    message: 'Transaction déjà synchronisée', 
                    transaction: rows[0] 
                });
            }
        }

        // 2. Insérer la nouvelle transaction
        const insertQuery = `
            INSERT INTO shift_transactions 
            (shift_id, client_name, sport, duration, amount_cash, amount_card, local_id) 
            VALUES ($1, $2, $3, $4, $5, $6, $7) 
            RETURNING *;
        `;
        
        const values = [parsedShiftId, client_name, sport, duration, parsedCash, parsedCard, local_id];
        const result = await pool.query(insertQuery, values);

        res.status(201).json({
            message: 'Transaction enregistrée avec succès',
            transaction: result.rows[0]
        });

    } catch (error) {
        console.error('Erreur lors de l\'ajout de la transaction:', error);
        res.status(500).json({ error: 'Erreur serveur lors de la sauvegarde de la transaction' });
    }
};