const { validateCashAmount, calculateShiftDuration } = require('../utils/validation');

describe('Logique Métier : Finance et Temps', () => {

    describe('Fonction: validateCashAmount', () => {
        it('doit retourner true pour un montant positif standard', () => {
            expect(validateCashAmount(150.50)).toBe(true);
        });

        it('doit retourner true pour une caisse vide (0€)', () => {
            expect(validateCashAmount(0)).toBe(true);
        });

        it('doit retourner false pour un montant négatif (Exemple: -10€)', () => {
            expect(validateCashAmount(-10)).toBe(false);
        });

        it('doit retourner false si on passe du texte ou une valeur nulle (Injections)', () => {
            expect(validateCashAmount('piratage')).toBe(false);
            expect(validateCashAmount(null)).toBe(false);
        });
    });

    describe('Fonction: calculateShiftDuration', () => {
        it('doit calculer correctement la durée en minutes (Ex: 2h30 = 150 min)', () => {
            const start = new Date('2026-04-11T10:00:00Z');
            const end = new Date('2026-04-11T12:30:00Z');
            expect(calculateShiftDuration(start, end)).toBe(150); 
        });

        it('doit retourner 0 si la date de fin est antérieure à la date de début', () => {
            const start = new Date('2026-04-11T15:00:00Z');
            const end = new Date('2026-04-11T14:00:00Z'); // Incohérence temporelle
            expect(calculateShiftDuration(start, end)).toBe(0);
        });
    });
});