const db = require('../config/db');

const processNfcScan = async (req, res) => {
    // 🔴 On récupère l'UID ET le timestamp envoyé par l'ESP32
    const { nfc_uid, timestamp } = req.body;

    if (!nfc_uid || !timestamp) {
        return res.status(400).json({ error: "L'UID du badge et l'horodatage sont requis." });
    }

    if (typeof nfc_uid !== 'string' || nfc_uid.trim().length < 4) {
        return res.status(400).json({ error: "UID NFC invalide." });
    }

    const parsedTimestamp = Number(timestamp);
    if (!Number.isFinite(parsedTimestamp) || parsedTimestamp <= 0) {
        return res.status(400).json({ error: "Horodatage invalide." });
    }

    // 🔴 LOGIQUE MÉTIER : Différencier un scan "En direct" d'une "Synchro différée"
    const now = Math.floor(Date.now() / 1000); // Timestamp actuel en secondes
    const scanAge = Math.abs(now - parsedTimestamp); // Âge du scan en secondes
    const isLiveScan = scanAge < 60; // Si le scan a moins d'une minute, il est "Live"

    try {
        const badgeQuery = `
            SELECT b.id AS badge_id, u.id AS user_id, u.first_name, u.last_name, b.is_active
            FROM badges b
            JOIN users u ON b.user_id = u.id
            WHERE b.nfc_uid = $1
        `;
        const { rows: badgeRows } = await db.query(badgeQuery, [nfc_uid]);

        if (badgeRows.length === 0) {
            return res.status(404).json({ error: "Badge inconnu ou non assigné." });
        }

        const user = badgeRows[0];
        
        if (!user.is_active) {
            return res.status(403).json({ error: "Ce badge a été désactivé." });
        }

        const fullName = `${user.first_name} ${user.last_name}`;

        const openShiftQuery = `
            SELECT s.id, s.user_id, u.first_name, u.last_name
            FROM shifts s
            JOIN users u ON s.user_id = u.id
            WHERE s.end_time IS NULL
        `;
        const { rows: shiftRows } = await db.query(openShiftQuery);

        if (shiftRows.length > 0) {
            const openShift = shiftRows[0];

            // SCÉNARIO A : Reprise de caisse
            if (openShift.user_id === user.user_id) {
                const shiftId = openShift.id;
                console.log(`[SCAN] ${fullName} reprend son shift #${shiftId} (Age du scan: ${scanAge}s)`);
                
                // 🔴 CONDITION WEBSOCKET : Uniquement si le jobiste vient de badger
                if (isLiveScan && req.io) {
                    req.io.emit('unlock_session', {
                        action: 'resume', 
                        jobisteName: fullName,
                        shift_id: shiftId
                    });
                } else {
                    console.log(`[INFO] Synchro silencieuse : pas de déverrouillage écran pour un vieux scan.`);
                }

                return res.status(200).json({
                    message: `Session reprise pour ${user.first_name}.`,
                    action: 'resume',
                    shift_id: shiftId,
                    user: { first_name: user.first_name, last_name: user.last_name }
                });

            } else {
                // SCÉNARIO B : Conflit
                const occupantName = `${openShift.first_name} ${openShift.last_name}`;
                console.warn(`[SCAN] Conflit : ${fullName} a badgé, mais la caisse est occupée par ${occupantName}`);
                return res.status(403).json({ 
                    error: "CAISSE_OCCUPEE",
                    message: `Caisse occupée par ${occupantName}`
                });
            }

        } else {
            // SCÉNARIO C : Nouveau shift
            // Idéalement on devrait insérer le timestamp de l'ESP32 ici avec to_timestamp($2), mais on garde CURRENT_TIMESTAMP pour éviter de casser ton schéma SQL pour l'instant.
            const openNewShiftQuery = `
                INSERT INTO shifts (user_id, start_time)
                VALUES ($1, CURRENT_TIMESTAMP)
                RETURNING id
            `;
            const newShiftResult = await db.query(openNewShiftQuery, [user.user_id]);
            const newShiftId = newShiftResult.rows[0].id;
            console.log(`[SCAN] Nouveau shift #${newShiftId} ouvert pour ${fullName} (Age: ${scanAge}s)`);

            // 🔴 CONDITION WEBSOCKET : Uniquement si le jobiste vient de badger
            if (isLiveScan && req.io) {
                req.io.emit('unlock_session', {
                    action: 'checkin',
                    jobisteName: fullName,
                    shift_id: newShiftId
                });
            } else {
                console.log(`[INFO] Synchro silencieuse : pas de déverrouillage écran pour un vieux scan.`);
            }

            return res.status(200).json({
                message: `Bonjour, ${user.first_name}. Début de shift enregistré.`,
                action: 'checkin',
                shift_id: newShiftId,
                user: { first_name: user.first_name, last_name: user.last_name }
            });
        }

    } catch (error) {
        if (error.code === '23505') {
            try {
                const fallbackQuery = `
                    SELECT s.id
                    FROM shifts s
                    JOIN badges b ON b.user_id = s.user_id
                    WHERE b.nfc_uid = $1 AND s.end_time IS NULL
                    LIMIT 1
                `;
                const { rows } = await db.query(fallbackQuery, [nfc_uid]);

                if (rows.length > 0) {
                    return res.status(200).json({
                        message: 'Session déjà ouverte (idempotence concurrence).',
                        action: 'resume',
                        shift_id: rows[0].id,
                    });
                }
            } catch (fallbackError) {
                console.error('❌ Erreur fallback sur conflit de scan:', fallbackError);
            }
        }

        console.error("❌ Erreur lors du scan NFC:", error);
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
};

module.exports = { processNfcScan };