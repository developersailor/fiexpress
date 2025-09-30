import request from 'supertest';
import express from 'express';

describe('App', () => {
  let app: express.Application;

  beforeAll(() => {
    // Import your app here
    app = express();
    app.use(express.json());
    app.get('/', (req, res) => {
      res.json({ message: 'test' });
    });
  });

  it('should respond to GET /', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('test');
  });
});
