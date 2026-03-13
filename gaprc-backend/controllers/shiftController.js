const pool = require('../config/db');

// POST /api/shifts/close
exports.closeShift = async (req, res) => {
    const { shift_id, comment, amount_cash, amount_card, transactions } = req.body;

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

        // Fermeture officielle du shift (on met à jour le end_time)
        const closeShiftQuery = `
            UPDATE shifts SET end_time = CURRENT_TIMESTAMP WHERE id = $1;
        `;
        await client.query(closeShiftQuery, [shift_id]);

        // FIN DE LA TRANSACTION SQL : On valide tout (CA5)
        await client.query('COMMIT');

        // CA4 : Retour HTTP 201
        res.status(201).json({
            message: 'Shift fermé, transactions sauvegardées et caisse validée avec succès.',
            report: reportResult.rows[0],
            transactions_saved: transactions ? transactions.length : 0
        });

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