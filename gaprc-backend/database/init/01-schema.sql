-- CA1 : Table users avec email UNIQUE, password_hash et role
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL, -- Indispensable pour la connexion de l'admin
    password_hash VARCHAR(255),         -- Pour stocker le bcrypt de l'admin
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'jobiste')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CA2 : Table badges liée à users avec nfc_uid UNIQUE
CREATE TABLE badges (
    id SERIAL PRIMARY KEY,
    nfc_uid VARCHAR(50) UNIQUE NOT NULL,
    user_id INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- CA3 : Table shifts liée à users avec start_time et end_time
CREATE TABLE shifts (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP, -- Peut être NULL tant que le shift n'est pas terminé
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- CA4 : Table cash_reports avec relation 1-1 stricte sur shifts
CREATE TABLE cash_reports (
    id SERIAL PRIMARY KEY,
    shift_id INT UNIQUE NOT NULL, -- Le UNIQUE garantit la relation 1-1 (un seul rapport par shift)
    expected_amount DECIMAL(10, 2) NOT NULL,
    actual_amount DECIMAL(10, 2) NOT NULL,
    difference DECIMAL(10, 2) GENERATED ALWAYS AS (actual_amount - expected_amount) STORED,
    report_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shift_id) REFERENCES shifts(id) ON DELETE CASCADE
);