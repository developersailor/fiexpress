import request from 'supertest';
import { app } from '../src/app';
import { SecurityMiddleware } from '../src/middleware/security.middleware';

describe('Security Tests', () => {
  let securityMiddleware: SecurityMiddleware;
  
  beforeEach(() => {
    securityMiddleware = new SecurityMiddleware();
  });
  
  describe('Helmet Security Headers', () => {
    it('should include security headers', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);
      
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
    });
  });
  
  describe('CSRF Protection', () => {
    it('should reject requests without CSRF token', async () => {
      await request(app)
        .post('/api/users')
        .send({ name: 'Test User' })
        .expect(403);
    });
    
    it('should accept requests with valid CSRF token', async () => {
      const csrfResponse = await request(app)
        .get('/csrf-token')
        .expect(200);
      
      const csrfToken = csrfResponse.body.csrfToken;
      
      await request(app)
        .post('/api/users')
        .set('X-CSRF-Token', csrfToken)
        .send({ name: 'Test User' })
        .expect(200);
    });
  });
  
  describe('Rate Limiting', () => {
    it('should limit requests per IP', async () => {
      const promises = Array(101).fill().map(() => 
        request(app).get('/api/test')
      );
      
      const responses = await Promise.all(promises);
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });
  
  describe('Input Validation', () => {
    it('should sanitize malicious input', async () => {
      const maliciousInput = '<script>alert("xss")</script>';
      
      const response = await request(app)
        .post('/api/test')
        .send({ input: maliciousInput })
        .expect(200);
      
      expect(response.body.input).not.toContain('<script>');
    });
    
    it('should prevent SQL injection', async () => {
      const sqlInjection = "'; DROP TABLE users; --";
      
      await request(app)
        .post('/api/test')
        .send({ query: sqlInjection })
        .expect(400);
    });
  });
  
  describe('Password Security', () => {
    it('should validate password strength', () => {
      const weakPassword = '123';
      const strongPassword = 'MyStr0ng!Pass';
      
      const weakResult = SecurityUtils.validatePasswordStrength(weakPassword);
      const strongResult = SecurityUtils.validatePasswordStrength(strongPassword);
      
      expect(weakResult.valid).toBe(false);
      expect(strongResult.valid).toBe(true);
    });
  });
});

export default SecurityTests;