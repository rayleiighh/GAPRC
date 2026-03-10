-- 1. Création des utilisateurs de test
INSERT INTO users (first_name, last_name, role) VALUES
('Jean', 'Directeur', 'admin'),
('Rayane', 'Jobiste', 'jobiste');

-- 2. Assignation des badges (En utilisant les UID de ton POC)
-- L'ID 1 correspond à Jean, l'ID 2 correspond à Rayane
INSERT INTO badges (nfc_uid, user_id) VALUES
('a74166', 1),   -- Badge du directeur
('5eaece6', 2);  -- Badge de Rayane

-- 3. Création d'un "faux" shift passé pour Rayane (qui a commencé il y a 8h et s'est terminé il y a 1 minute)
INSERT INTO shifts (user_id, start_time, end_time) VALUES
(2, CURRENT_TIMESTAMP - INTERVAL '8 hours', CURRENT_TIMESTAMP - INTERVAL '1 minute');

-- 4. Création du rapport de caisse lié à ce shift (shift_id 1)
-- La colonne 'difference' se calculera toute seule grâce à ton architecture !
INSERT INTO cash_reports (shift_id, expected_amount, actual_amount) VALUES
(1, 150.00, 150.00);