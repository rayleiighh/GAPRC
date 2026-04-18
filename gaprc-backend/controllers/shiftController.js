const pool = require('../config/db');
const { logAudit } = require('../utils/audit');

// POST /api/shifts/close
exports.closeShift = async (req, res) => {
    const { shift_id, comment, amount_cash, amount_card, transactions, start_time, end_time } = req.body;

    // On récupère un client dédié du pool pour faire la transaction SQL (CA5)
    const client = await pool.connect(); 

    try {
        // DÉBUT DE LA TRANSACTION SQL (ACID)
        await client.query('BEGIN');

        let expected_amount = 0;

        // CA3 & CA4 : Insertion des transactions (si le tableau existe et n'est pas vide)
        if (transactions && Array.isArray(transactions) && transactions.length > 0) {
            for (let txn of transactions) {
                // On additionne au vol pour calculer la caisse théorique (CA4)
                expected_amount += parseFloat(txn.amount_cash || 0) + parseFloat(txn.amount_card || 0);

                const txnQuery = `
                    INSERT INTO shift_transactions 
                    (shift_id, client_name, sport, duration, amount_cash, amount_card, local_id) 
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                    ON CONFLICT (local_id) DO NOTHING; -- Idempotence PWA
                `;
                await client.query(txnQuery, [
                    shift_id, txn.client_name, txn.sport, txn.duration, 
                    txn.amount_cash, txn.amount_card, txn.local_id
                ]);
            }
        }

        const actual_amount = parseFloat(amount_cash) + parseFloat(amount_card);

        // Insertion du rapport de caisse avec le total calculé
        const reportQuery = `
            INSERT INTO cash_reports (shift_id, expected_amount, actual_amount)
            VALUES ($1, $2, $3)
            RETURNING *;
        `;
        const reportResult = await client.query(reportQuery, [shift_id, expected_amount, actual_amount]);

        // Fermeture officielle du shift (On insère les heures et le commentaire)
        const closeShiftQuery = `
            UPDATE shifts 
            SET start_time = $2, 
                end_time = $3,
                comment = $4
            WHERE id = $1;
        `;
        await client.query(closeShiftQuery, [shift_id, start_time, end_time, comment]);

        const performedBy = req.user?.id ? `user:${req.user.id}` : 'kiosk';
        await logAudit(
            'CLOSE_SHIFT',
            'shift',
            shift_id,
            performedBy,
            {
                montant_calcule: expected_amount,
                montant_declare: actual_amount,
                ecart: actual_amount - expected_amount,
            },
            client
        );

        // FIN DE LA TRANSACTION SQL : On valide tout (CA5)
        await client.query('COMMIT');

        // CA4 : Retour HTTP 201
        res.status(201).json({
            message: 'Shift fermé, transactions sauvegardées et caisse validée avec succès.',
            report: reportResult.rows[0],
            transactions_saved: transactions ? transactions.length : 0
        });
        
        if (req.io) {
            req.io.emit("shift_closed");
            console.log("📡 Signal 'shift_closed' envoyé au Dashboard !");
        } else {
            console.warn("⚠️ Socket.io n'est pas attaché à la requête");
        }

    } catch (error) {
        // EN CAS D'ERREUR (Crash serveur, doublon, problème réseau) : ON ANNULE TOUT !
        await client.query('ROLLBACK'); 

        // Gestion de l'idempotence pour la PWA (si le shift est déjà clôturé)
        if (error.code === '23505') {
            console.log(`[PWA Sync] Tentative de clôture en double ignorée pour le shift ${shift_id}`);
            return res.status(200).json({ message: 'Shift déjà clôturé (Idempotence).' });
        }

        console.error('Erreur SQL Transaction:', error);
        res.status(500).json({ error: 'Erreur critique lors de la fermeture du shift. Annulation.' });
    } finally {
        // Toujours relâcher le client à la fin, quoi qu'il arrive !
        client.release();
    }
};

// ==========================================
// NOUVELLE FONCTION POUR LE DASHBOARD DIRECTEUR
// ==========================================

// GET /api/shifts
exports.getAllShifts = async (req, res) => {
    try {
        // On récupère les heures pures, sans conversion !
        const query = `
            SELECT 
                s.id,
                u.first_name || ' ' || u.last_name AS jobiste,
                TO_CHAR(s.start_time, 'YYYY-MM-DD') AS date,
                TO_CHAR(s.start_time, 'HH24:MI') AS arrivee,
                TO_CHAR(s.end_time, 'HH24:MI') AS depart,
                ROUND(EXTRACT(EPOCH FROM (s.end_time - s.start_time)) / 3600, 2) AS heures,
                cr.expected_amount AS attendu,
                cr.actual_amount AS reel,
                (cr.actual_amount - cr.expected_amount) AS ecart
            FROM shifts s
            JOIN users u ON s.user_id = u.id
            JOIN cash_reports cr ON s.id = cr.shift_id
            WHERE s.end_time IS NOT NULL
            ORDER BY s.start_time DESC;
        `;
        
        const { rows } = await pool.query(query);
        res.status(200).json(rows);

    } catch (error) {
        console.error('Erreur getAllShifts:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des shifts' });
    }
};

// GET /api/shifts/:id/details
exports.getShiftDetails = async (req, res) => {
    const { id } = req.params;
    try {
        // 1. Récupérer le commentaire éventuel laissé par le jobiste
        const shiftResult = await pool.query('SELECT comment FROM shifts WHERE id = $1', [id]);
        const comment = shiftResult.rows[0]?.comment || "";

        // 2. Récupérer toutes les transactions de ce shift
        const txResult = await pool.query(`
            SELECT client_name, sport, duration, amount_cash, amount_card 
            FROM shift_transactions 
            WHERE shift_id = $1 
            ORDER BY id ASC
        `, [id]);
        
        res.status(200).json({
            comment,
            transactions: txResult.rows
        });
    } catch (error) {
        console.error('Erreur getShiftDetails:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des détails' });
    }
};