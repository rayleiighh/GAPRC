const db = require('../config/db');

const processNfcScan = async (req, res) => {
    // CA1 : Récupérer l'UID envoyé par l'ESP32
    const { nfc_uid } = req.body;

    if (!nfc_uid) {
        return res.status(400).json({ error: "L'UID du badge est requis." });
    }

    try {
        // CA2 : Requête paramétrée ($1) pour éviter les injections SQL
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
        const fullName = `${user.first_name} ${user.last_name}`;

        // CA4 : Vérifier s'il y a un shift en cours (end_time IS NULL)
        const openShiftQuery = `
            SELECT id FROM shifts
            WHERE user_id = $1 AND end_time IS NULL
        `;
        const { rows: shiftRows } = await db.query(openShiftQuery, [user.user_id]);

        if (shiftRows.length > 0) {
            // SCÉNARIO A : UN SHIFT EST DÉJÀ OUVERT !
            // Le jobiste a badgé une deuxième fois. Dans ton flux TFE, ça veut dire 
            // qu'il veut "rouvrir" l'écran de caisse en cours.
            const shiftId = shiftRows[0].id;
            
            // 🪄 MAGIE TEMPS RÉEL (CA2 de l'Issue 2) : On déverrouille le kiosque
            req.io.emit('unlock_session', {
                action: 'resume', // Indique que c'est une reprise
                jobisteName: fullName,
                shift_id: shiftId
            });

            return res.status(200).json({
                message: `Session reprise pour ${user.first_name}.`,
                action: 'resume',
                user: { first_name: user.first_name, last_name: user.last_name }
            });

        } else {
            // SCÉNARIO B : PAS DE SHIFT OUVERT -> On en crée un nouveau (Check-in)
            const openNewShiftQuery = `
                INSERT INTO shifts (user_id, start_time)
                VALUES ($1, CURRENT_TIMESTAMP)
                RETURNING id
            `;
            // On récupère l'ID du shift nouvellement créé grâce au RETURNING id
            const newShiftResult = await db.query(openNewShiftQuery, [user.user_id]);
            const newShiftId = newShiftResult.rows[0].id;

            // 🪄 MAGIE TEMPS RÉEL (CA2 de l'Issue 2) : On déverrouille le kiosque
            req.io.emit('unlock_session', {
                action: 'checkin', // Nouveau shift
                jobisteName: fullName,
                shift_id: newShiftId
            });

            return res.status(200).json({
                message: `Bonjour, ${user.first_name}. Début de shift enregistré.`,
                action: 'checkin',
                shift_id: newShiftId,
                user: { first_name: user.first_name, last_name: user.last_name }
            });
        }

    } catch (error) {
        console.error("❌ Erreur lors du scan NFC:", error);
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
};

module.exports = { processNfcScan };