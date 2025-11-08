import request from 'supertest';
import app from '../src/app'; // export express app in src/app.ts

describe('Wallet API', () => {
  test('create ledger entry and read balance', async () => {
    const userId = '00000000-0000-0000-0000-000000000001';
    await request(app).post('/ledger').send({ user_id: userId, tx_id: '1111-2222-3333', account: 'WALLET_MAIN', amount: 50, currency:'USD', type:'credit' }).expect(200);
    const res = await request(app).get(`/balance/${userId}`).expect(200);
    expect(res.body).toEqual(expect.arrayContaining([expect.objectContaining({ account: 'WALLET_MAIN' })]));
  });
});
