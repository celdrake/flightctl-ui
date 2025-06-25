import {
  createCsrPem,
  exportKeyToPem,
  generateCsrKeys,
  getApiCsrRequest,
  isBrowserCryptoSupported,
} from './certificateRequests';

// Helper function to convert base64 string to Uint8Array
const base64ToDERFormat = (base64: string): Uint8Array => {
  return new Uint8Array(
    atob(base64)
      .split('')
      .map((c) => c.charCodeAt(0)),
  );
};

// Known valid ECDSA private key base64 encoded -> PKCS#8 DER format
const knownPrivateKeyBase64 =
  'MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgAQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyChRANCAATBAhESExQVFhcYGRobHB0eHyAhIiMkJSYnKCkqKysrLCwtLi8wMTIzNDU2Nzg5Ojs8PT4/QA==';
const knownPrivateKeyDER = base64ToDERFormat(knownPrivateKeyBase64);

// Known valid ECDSA public key base64 encoded -> SPKI DER format
const knownPublicKeyBase64 =
  'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEAQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyAhIiMkJSYnKCkqKywtLi8wMTIzNDU2Nzg5Ojs8PT4/QA==';
const knownPublicKeyDER = base64ToDERFormat(knownPublicKeyBase64);

// Known valid ECDSA signature base64 encoded -> DER format
const knownSignatureBase64 = 'AQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyAhIiMkJSYnKCkqKywtLi8wMTIzNDU2Nzg5Ojs8PT4/QA==';
const knownSignature = base64ToDERFormat(knownSignatureBase64);

// Mock crypto type for tests
interface MockCrypto {
  subtle: {
    generateKey: jest.MockedFunction<SubtleCrypto['generateKey']>;
    exportKey: jest.MockedFunction<SubtleCrypto['exportKey']>;
    sign: jest.MockedFunction<SubtleCrypto['sign']>;
    verify: jest.MockedFunction<SubtleCrypto['verify']>;
  };
  getRandomValues: jest.MockedFunction<Crypto['getRandomValues']>;
}

describe('Certificate Request Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isBrowserCryptoSupported', () => {
    it('should return true when crypto APIs are available', () => {
      expect(isBrowserCryptoSupported()).toBe(true);
    });

    it('should return false when crypto APIs are not available', () => {
      const originalCrypto = global.window.crypto;
      // @ts-expect-error - intentionally setting to undefined for test
      global.window.crypto = undefined;

      expect(isBrowserCryptoSupported()).toBe(false);

      global.window.crypto = originalCrypto;
    });

    it('should return false when subtle crypto is not available', () => {
      const originalCrypto = global.window.crypto;
      global.window.crypto = {
        ...originalCrypto,
        // @ts-expect-error - intentionally setting to undefined for test
        subtle: undefined,
      };

      expect(isBrowserCryptoSupported()).toBe(false);

      global.window.crypto = originalCrypto;
    });
  });

  describe('getApiCsrRequest', () => {
    it('should create a valid CSR request object', () => {
      const csrName = 'test-csr';
      const csrPem = 'some-pem';
      const expirationDays = 30;

      const result = getApiCsrRequest(csrName, csrPem, expirationDays);

      expect(result).toEqual({
        apiVersion: 'v1alpha1',
        kind: 'CertificateSigningRequest',
        metadata: {
          name: csrName,
        },
        spec: {
          expirationSeconds: 30 * 24 * 60 * 60, // 30 days in seconds
          request: btoa(csrPem),
          signerName: 'enrollment',
          usages: ['clientAuth', 'CA:false'],
        },
      });
    });
  });

  describe('generateCsrKeys - mocked crypto', () => {
    const mockKeyPair = {
      privateKey: { type: 'private' } as CryptoKey,
      publicKey: { type: 'public' } as CryptoKey,
    };

    const mockPrivateKeyDER = new ArrayBuffer(8);
    const mockPublicKeyDER = new ArrayBuffer(8);
    const mockSignature = new ArrayBuffer(64); // P-256 signature

    beforeEach(() => {
      const mockCrypto = window.crypto as unknown as MockCrypto;
      mockCrypto.subtle.generateKey.mockResolvedValue(mockKeyPair);
      mockCrypto.subtle.exportKey.mockImplementation((_format: string, key: CryptoKey) => {
        if (key.type === 'private') {
          return Promise.resolve(mockPrivateKeyDER);
        }
        return Promise.resolve(mockPublicKeyDER);
      });
      mockCrypto.subtle.sign.mockResolvedValue(mockSignature);
    });

    it('should call crypto APIs with correct parameters', async () => {
      const csrName = 'test-device';
      const mockCrypto = window.crypto as unknown as MockCrypto;

      await generateCsrKeys(csrName);

      expect(mockCrypto.subtle.generateKey).toHaveBeenCalledWith(
        {
          name: 'ECDSA',
          namedCurve: 'P-256',
        },
        true,
        ['sign', 'verify'],
      );

      expect(mockCrypto.subtle.exportKey).toHaveBeenCalledWith('pkcs8', mockKeyPair.privateKey);
      expect(mockCrypto.subtle.exportKey).toHaveBeenCalledWith('spki', mockKeyPair.publicKey);
    });

    it('should handle crypto API errors', async () => {
      const csrName = 'test-device';
      const error = new Error('Crypto API failed');
      const mockCrypto = window.crypto as unknown as MockCrypto;

      mockCrypto.subtle.generateKey.mockRejectedValue(error);

      await expect(generateCsrKeys(csrName)).rejects.toThrow(
        'Failed to create certificate request: Error: Failed to generate ECDSA key pair: Error: Crypto API failed',
      );
    });
  });

  describe('createCsrPem', () => {
    it('should create a valid CSR PEM with proper structure', async () => {
      const csrName = 'test-csr';

      // Create hardcoded key pair using the known test data
      const keyPair = {
        privateKey: {
          type: 'private',
          _testData: knownPrivateKeyDER.buffer,
        } as unknown as CryptoKey,
        publicKey: {
          type: 'public',
          _testData: knownPublicKeyDER.buffer,
        } as unknown as CryptoKey,
      };

      // Mock the crypto operations for this specific test
      const mockCrypto = window.crypto as unknown as MockCrypto;
      mockCrypto.subtle.exportKey.mockImplementation(
        (_format: string, key: CryptoKey & { _testData?: ArrayBuffer }) => {
          return Promise.resolve(key._testData || new ArrayBuffer(0));
        },
      );
      mockCrypto.subtle.sign.mockResolvedValue(knownSignature.buffer);

      const csrPem = await createCsrPem(csrName, keyPair);

      // Verify PEM format
      expect(csrPem).toMatch(/^-----BEGIN CERTIFICATE REQUEST-----\n[\s\S]+\n-----END CERTIFICATE REQUEST-----$/);

      // Verify PEM content is valid base64
      const extractBase64 = (pem: string) => pem.split('\n').slice(1, -1).join('');
      expect(() => atob(extractBase64(csrPem))).not.toThrow();

      // Verify the CSR contains the device name
      const csrBase64 = extractBase64(csrPem);
      const csrDER = atob(csrBase64);
      expect(csrDER).toContain(csrName);
    });
  });

  describe('exportKeyToPem', () => {
    it('converts a private key to its proper PEM format', async () => {
      // Create a mock private key
      const mockPrivateKey = {
        type: 'private',
        _testData: knownPrivateKeyDER.buffer,
      } as unknown as CryptoKey;

      // Mock the crypto exportKey operation
      const mockCrypto = window.crypto as unknown as MockCrypto;
      mockCrypto.subtle.exportKey.mockResolvedValue(knownPrivateKeyDER.buffer);

      const result = await exportKeyToPem(mockPrivateKey);

      // Verify PEM format
      expect(result).toMatch(/^-----BEGIN PRIVATE KEY-----\n[\s\S]+\n-----END PRIVATE KEY-----$/);

      // Verify PEM content is valid base64
      const extractBase64 = (pem: string) => pem.split('\n').slice(1, -1).join('');
      const base64Content = extractBase64(result);
      expect(() => atob(base64Content)).not.toThrow();

      // Verify the decoded content matches the original DER
      const decoded = base64ToDERFormat(base64Content);
      expect(decoded).toEqual(knownPrivateKeyDER);
    });

    it('converts a public key to its proper PEM format', async () => {
      // Create a mock public key
      const mockPublicKey = {
        type: 'public',
        _testData: knownPublicKeyDER.buffer,
      } as unknown as CryptoKey;

      // Mock the crypto exportKey operation
      const mockCrypto = window.crypto as unknown as MockCrypto;
      mockCrypto.subtle.exportKey.mockResolvedValue(knownPublicKeyDER.buffer);

      const result = await exportKeyToPem(mockPublicKey);

      // Verify PEM format
      expect(result).toMatch(/^-----BEGIN PUBLIC KEY-----\n[\s\S]+\n-----END PUBLIC KEY-----$/);

      // Verify PEM content is valid base64
      const extractBase64 = (pem: string) => pem.split('\n').slice(1, -1).join('');
      const base64Content = extractBase64(result);
      expect(() => atob(base64Content)).not.toThrow();

      // Verify the decoded content matches the original DER
      const decoded = base64ToDERFormat(base64Content);
      expect(decoded).toEqual(knownPublicKeyDER);
    });

    it('should call crypto.subtle.exportKey with correct parameters', async () => {
      const mockPrivateKey = {
        type: 'private',
      } as unknown as CryptoKey;

      const mockCrypto = window.crypto as unknown as MockCrypto;
      mockCrypto.subtle.exportKey.mockResolvedValue(knownPrivateKeyDER.buffer);

      await exportKeyToPem(mockPrivateKey);

      expect(mockCrypto.subtle.exportKey).toHaveBeenCalledWith('pkcs8', mockPrivateKey);
    });

    it('should handle crypto export errors', async () => {
      const mockKey = { type: 'private' } as unknown as CryptoKey;
      const error = new Error('Export failed');

      const mockCrypto = window.crypto as unknown as MockCrypto;
      mockCrypto.subtle.exportKey.mockRejectedValue(error);

      await expect(exportKeyToPem(mockKey)).rejects.toThrow('Export failed');
    });
  });
});
