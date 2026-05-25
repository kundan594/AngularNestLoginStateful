import { Test, TestingModule } from '@nestjs/testing';
import { CsrfService } from './csrf.service';

describe('CsrfService', () => {
  let service: CsrfService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CsrfService],
    }).compile();

    service = module.get<CsrfService>(CsrfService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateSecret', () => {
    it('should generate a secret', () => {
      const secret = service.generateSecret();
      expect(secret).toBeDefined();
      expect(typeof secret).toBe('string');
      expect(secret.length).toBeGreaterThan(0);
    });

    it('should generate unique secrets', () => {
      const secret1 = service.generateSecret();
      const secret2 = service.generateSecret();
      expect(secret1).not.toBe(secret2);
    });
  });

  describe('generateToken', () => {
    it('should generate a token from a secret', () => {
      const secret = service.generateSecret();
      const token = service.generateToken(secret);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('should generate different tokens for different secrets', () => {
      const secret1 = service.generateSecret();
      const secret2 = service.generateSecret();
      const token1 = service.generateToken(secret1);
      const token2 = service.generateToken(secret2);
      expect(token1).not.toBe(token2);
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const secret = service.generateSecret();
      const token = service.generateToken(secret);
      const isValid = service.verifyToken(secret, token);
      expect(isValid).toBe(true);
    });

    it('should reject an invalid token', () => {
      const secret = service.generateSecret();
      const invalidToken = 'invalid-token';
      const isValid = service.verifyToken(secret, invalidToken);
      expect(isValid).toBe(false);
    });

    it('should reject a token with wrong secret', () => {
      const secret1 = service.generateSecret();
      const secret2 = service.generateSecret();
      const token = service.generateToken(secret1);
      const isValid = service.verifyToken(secret2, token);
      expect(isValid).toBe(false);
    });

    it('should reject an empty token', () => {
      const secret = service.generateSecret();
      const isValid = service.verifyToken(secret, '');
      expect(isValid).toBe(false);
    });
  });
});

// Made with Bob
