const db = require('../config/db');

const processNfcScan = async (req, res) => {
    // CA1 : Récupérer l'UID envoyé par l'ESP32
    const { nfc_uid } = req.body;

    if (!nfc_uid) {
        return res.status(400).json({ error: "L'UID du badge est requis." });
    }

    try {
        // CA2 : Requête paramétrée ($1) pour éviter les injections SQL
        // On joint la table users pour avoir le nom de la personne
        const badgeQuery = `
            SELECT b.id AS badge_id, u.id AS user_id, u.first_name, u.last_name, u.role
            FROM badges b
            JOIN users u ON b.user_id = u.id
            WHERE b.nfc_uid = $1 AND b.is_active = TRUE
        `;
        const { rows: badgeRows } = await db.query(badgeQuery, [nfc_uid]);

        // CA3 : Si le badge est inconnu ou inactif
        if (badgeRows.length === 0) {
            return res.status(404).json({ error: "Badge inconnu ou inactif." });
        }

        const user = badgeRows[0];

        // CA4 : Vérifier s'il y a un shift en cours (end_time IS NULL)
        const openShiftQuery = `
            SELECT id FROM shifts
            WHERE user_id = $1 AND end_time IS NULL
        `;
        const { rows: shiftRows } = await db.query(openShiftQuery, [user.user_id]);

        if (shiftRows.length > 0) {
            // SCÉNARIO A : Un shift est ouvert -> On le ferme (Check-out)
            const shiftId = shiftRows[0].id;
            const closeShiftQuery = `
                UPDATE shifts
                SET end_time = CURRENT_TIMESTAMP
                WHERE id = $1
            `;
            await db.query(closeShiftQuery, [shiftId]);

            return res.status(200).json({
                message: `Au revoir, ${user.first_name}. Fin de shift enregistrée.`,
                action: 'checkout',
                user: { first_name: user.first_name, last_name: user.last_name }
            });

        } else {
            // SCÉNARIO B : Pas de shift ouvert -> On en crée un nouveau (Check-in)
            const openNewShiftQuery = `
                INSERT INTO shifts (user_id, start_time)
                VALUES ($1, CURRENT_TIMESTAMP)
            `;
            await db.query(openNewShiftQuery, [user.user_id]);

            return res.status(200).json({
                message: `Bonjour, ${user.first_name}. Début de shift enregistré.`,
                action: 'checkin',
                user: { first_name: user.first_name, last_name: user.last_name }
            });
        }

    } catch (error) {
        console.error("❌ Erreur lors du scan NFC:", error);
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
};

module.exports = { processNfcScan };