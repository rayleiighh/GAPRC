const pool = require('../config/db');

/**
 * Enregistre une action sensible dans le journal d'audit (RGPD)
 * @param {string} action - Le nom de l'action (ex: 'CLOSE_SHIFT')
 * @param {string} entity - L'entité modifiée (ex: 'shift', 'badge')
 * @param {string|number} entity_id - L'ID de l'entité
 * @param {string} performed_by - L'utilisateur qui a fait l'action
 * @param {object} details - Objet JSON contenant les anciennes/nouvelles valeurs
 * @param {object} client - (Optionnel) Client PostgreSQL si on est dans une transaction
 */
const logAudit = async (action, entity, entity_id, performed_by, details = {}, client = pool) => {
    try {
        const query = `
            INSERT INTO audit_logs (action, entity, entity_id, performed_by, details)
            VALUES ($1, $2, $3, $4, $5)
        `;
        const values = [action, entity, entity_id, performed_by, JSON.stringify(details)];
        await client.query(query, values);
        console.log(`[AUDIT] ${action} sur ${entity} #${entity_id} par ${performed_by}`);
    } catch (error) {
        console.error("❌ Erreur lors de la journalisation d'audit :", error);
    }
};

module.exports = { logAudit };