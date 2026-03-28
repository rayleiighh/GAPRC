-- CA1 : 1 Admin (avec hash bcrypt pour "Admin123!") et 2 Jobistes
INSERT INTO users (id, first_name, last_name, email, password_hash, role) VALUES
(1, 'Jean', 'Directeur', 'admin@gaprc.be', '$2b$10$eHQwG1ZorX.W.A5EIVfRbOKdVXdBPAiQug1UJmLLbSbAT9Uw66g..', 'admin'),
(2, 'Rayane', 'Jobiste 1', 'rayane@gaprc.be', NULL, 'jobiste'),
(3, 'Marc', 'Jobiste 2', 'marc@gaprc.be', NULL, 'jobiste')
ON CONFLICT (id) DO NOTHING;

-- Réinitialise le compteur d'ID
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

-- CA2 : 2 badges NFC valides avec les vrais UID, liés aux jobistes
INSERT INTO badges (nfc_uid, user_id) VALUES
('a74166', 2),   -- Badge réel assigné à Rayane
('5eaece6', 3)   -- Badge réel assigné à Marc
ON CONFLICT (nfc_uid) DO NOTHING;

-- CA3 : Historique factice de 3 shifts (2 passés, 1 en cours)
INSERT INTO shifts (id, user_id, start_time, end_time, comment) VALUES
(1, 2, CURRENT_TIMESTAMP - INTERVAL '2 days 8 hours', CURRENT_TIMESTAMP - INTERVAL '2 days 1 minute', 'Super session, beaucoup de monde au tennis ce matin.'),
(2, 3, CURRENT_TIMESTAMP - INTERVAL '1 days 8 hours', CURRENT_TIMESTAMP - INTERVAL '1 days 1 minute', NULL),
(3, 2, CURRENT_TIMESTAMP - INTERVAL '4 hours', NULL, NULL) -- Shift en cours, pas de fin
ON CONFLICT (id) DO NOTHING;

-- Réinitialise le compteur d'ID
SELECT setval('shifts_id_seq', (SELECT MAX(id) FROM shifts));

-- CA3 (Suite) : 2 rapports de caisse associés aux shifts clôturés
INSERT INTO cash_reports (shift_id, expected_amount, actual_amount) VALUES
(1, 150.00, 150.00),   -- Caisse parfaite
(2, 200.00, 195.50)    -- Erreur de caisse de -4.50€
ON CONFLICT (shift_id) DO NOTHING;

-- Issue #29 - CA3 : Fausses transactions associées aux shifts existants (avec la durée en texte !)
INSERT INTO shift_transactions (shift_id, client_name, sport, duration, amount_cash, amount_card, local_id) VALUES
(1, 'Jean Dupont', 'Tennis', '1h', 15.00, 0.00, 'txn_local_12345'),
(1, 'Equipe Vétérans', 'Mini-foot', '2h', 0.00, 50.00, 'txn_local_12346'),
(2, 'Marie Curie', 'Badminton', '1h', 10.00, 0.00, 'txn_local_12347')
ON CONFLICT (local_id) DO NOTHING;