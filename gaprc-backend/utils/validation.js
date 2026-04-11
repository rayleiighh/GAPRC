const validateCashAmount = (amount) => {
    if (amount === undefined || amount === null) return false;
    
    // On s'assure que c'est un nombre valide
    const parsed = parseFloat(amount);
    if (isNaN(parsed)) return false;
    
    // Règle métier stricte : pas de caisse négative
    if (parsed < 0) return false; 
    
    return true;
};

// Calcul de la durée d'un shift en minutes
const calculateShiftDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return 0;
    
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    // Règle métier stricte : un shift ne peut pas se terminer avant d'avoir commencé
    if (start > end) return 0; 
    
    const diffMs = end.getTime() - start.getTime();
    return Math.floor(diffMs / (1000 * 60)); // Conversion des millisecondes en minutes
};

module.exports = { validateCashAmount, calculateShiftDuration };