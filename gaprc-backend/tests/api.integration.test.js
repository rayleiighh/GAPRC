const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

jest.mock('../config/db', () => ({
    query: jest.fn(),
    connect: jest.fn(),
    on: jest.fn(),
}));

const db = require('../config/db');
const { app } = require('../server');

describe('API Integration - Quick wins critiques', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.JWT_SECRET = 'test_secret_key';
    });

    it('POST /api/scan retourne 200 resume sur conflit concurrent (23505)', async () => {
        const now = Math.floor(Date.now() / 1000);

        const uniqueError = new Error('duplicate key value violates unique constraint');
        uniqueError.code = '23505';

        db.query
            .mockResolvedValueOnce({
                rows: [{ badge_id: 1, user_id: 11, first_name: 'Rayane', last_name: 'Test', is_active: true }],
            })
            .mockResolvedValueOnce({ rows: [] })
            .mockRejectedValueOnce(uniqueError)
            .mockResolvedValueOnce({ rows: [{ id: 42 }] });

        const res = await request(app)
            .post('/api/scan')
            .send({ nfc_uid: 'A1B2C3D4', timestamp: now });

        expect(res.status).toBe(200);
        expect(res.body.action).toBe('resume');
        expect(res.body.shift_id).toBe(42);
    });

    it('POST /api/admin/change-password refuse un mot de passe actuel incorrect', async () => {
        const token = jwt.sign({ id: 1, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });
        const hash = await bcrypt.hash('OldPass123!', 10);

        db.query.mockResolvedValueOnce({
            rows: [{ id: 1, email: 'admin@gaprc.be', password_hash: hash }],
        });

        const res = await request(app)
            .post('/api/admin/change-password')
            .set('Authorization', `Bearer ${token}`)
            .send({
                currentPassword: 'WrongPass123!',
                newPassword: 'NewPass123!',
                confirmPassword: 'NewPass123!',
            });

        expect(res.status).toBe(401);
        expect(res.body.error).toMatch(/Mot de passe actuel incorrect/i);
        expect(db.query).toHaveBeenCalledTimes(1);
    });
});
