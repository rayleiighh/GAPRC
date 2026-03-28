const db = require('../config/db');

const processNfcScan = async (req, res) => {
    // CA1 : Récupérer l'UID envoyé par l'ESP32
    const { nfc_uid } = req.body;

    if (!nfc_uid) {
        return res.status(400).json({ error: "L'UID du badge est requis." });
    }

    try {
        // CA2 : Requête paramétrée pour trouver l'utilisateur du badge
        const badgeQuery = `
            SELECT b.id AS badge_id, u.id AS user_id, u.first_name, u.last_name, b.is_active
            FROM badges b
            JOIN users u ON b.user_id = u.id
            WHERE b.nfc_uid = $1
        `;
        const { rows: badgeRows } = await db.query(badgeQuery, [nfc_uid]);

        // CA3 : Si le badge est inconnu
        if (badgeRows.length === 0) {
            return res.status(404).json({ error: "Badge inconnu ou non assigné." });
        }

        const user = badgeRows[0];
        
        // Vérification si le badge est désactivé
        if (!user.is_active) {
            return res.status(403).json({ error: "Ce badge a été désactivé." });
        }

        const fullName = `${user.first_name} ${user.last_name}`;

        // 🚨 NOUVEAU (Issue 14) : On cherche s'il y a N'IMPORTE QUEL shift en cours (Globalement)
        const openShiftQuery = `
            SELECT s.id, s.user_id, u.first_name, u.last_name
            FROM shifts s
            JOIN users u ON s.user_id = u.id
            WHERE s.end_time IS NULL
        `;
        const { rows: shiftRows } = await db.query(openShiftQuery);

        // Si une caisse est actuellement ouverte
        if (shiftRows.length > 0) {
            const openShift = shiftRows[0];

            // SCÉNARIO A : C'est le BON jobiste (Il reprend sa caisse)
            if (openShift.user_id === user.user_id) {
                const shiftId = openShift.id;
                console.log(`[SCAN] ${fullName} reprend son shift #${shiftId}`);
                
                // 🪄 MAGIE TEMPS RÉEL : On déverrouille le kiosque
                if (req.io) {
                    req.io.emit('unlock_session', {
                        action: 'resume', 
                        jobisteName: fullName,
                        shift_id: shiftId
                    });
                }

                return res.status(200).json({
                    message: `Session reprise pour ${user.first_name}.`,
                    action: 'resume',
                    shift_id: shiftId,
                    user: { first_name: user.first_name, last_name: user.last_name }
                });

            } else {
                // 🛑 SCÉNARIO B : CONFLIT ! Un autre jobiste essaie de badger
                const occupantName = `${openShift.first_name} ${openShift.last_name}`;
                console.warn(`[SCAN] Conflit : ${fullName} a badgé, mais la caisse est occupée par ${occupantName}`);
                
                // On bloque l'accès (HTTP 403)
                return res.status(403).json({ 
                    error: "CAISSE_OCCUPEE",
                    message: `Caisse occupée par ${occupantName}`
                });
            }

        } else {
            // SCÉNARIO C : PAS DE SHIFT OUVERT -> On en crée un nouveau (Check-in)
            const openNewShiftQuery = `
                INSERT INTO shifts (user_id, start_time)
                VALUES ($1, CURRENT_TIMESTAMP)
                RETURNING id
            `;
            const newShiftResult = await db.query(openNewShiftQuery, [user.user_id]);
            const newShiftId = newShiftResult.rows[0].id;
            console.log(`[SCAN] Nouveau shift #${newShiftId} ouvert pour ${fullName}`);

            // 🪄 MAGIE TEMPS RÉEL : On déverrouille le kiosque
            if (req.io) {
                req.io.emit('unlock_session', {
                    action: 'checkin',
                    jobisteName: fullName,
                    shift_id: newShiftId
                });
            }

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