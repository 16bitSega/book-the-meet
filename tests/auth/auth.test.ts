import { describe, it, expect } from "vitest";
import {
  hashPassword,
  comparePassword,
  generateVerificationToken,
  hashToken,
  signJwt,
  verifyJwt,
} from "../../src/lib/auth";

describe("Auth Utilities & Cryptography Unit Tests", () => {
  it("should correctly hash and compare passwords with bcrypt", async () => {
    const password = "securePassword123!";
    const hash = await hashPassword(password);

    expect(hash).not.toBe(password);
    expect(await comparePassword(password, hash)).toBe(true);
    expect(await comparePassword("wrongPassword", hash)).toBe(false);
  });

  it("should generate 64-character high-entropy hex verification tokens", () => {
    const token1 = generateVerificationToken();
    const token2 = generateVerificationToken();

    expect(token1).toHaveLength(64);
    expect(token2).toHaveLength(64);
    expect(token1).not.toBe(token2);
    expect(/^[0-9a-f]{64}$/.test(token1)).toBe(true);
  });

  it("should deterministically hash tokens with SHA-256", () => {
    const rawToken = "abc123def4567890abc123def4567890abc123def4567890abc123def4567890";
    const hash1 = hashToken(rawToken);
    const hash2 = hashToken(rawToken);

    expect(hash1).toHaveLength(64);
    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(rawToken);
  });

  it("should sign and verify JWT tokens containing userId and tokenVersion", () => {
    const payload = { userId: "user-uuid-123", tokenVersion: 1 };
    const token = signJwt(payload);

    expect(typeof token).toBe("string");

    const decoded = verifyJwt(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.userId).toBe("user-uuid-123");
    expect(decoded?.tokenVersion).toBe(1);
  });

  it("should return null for malformed or tampered JWT tokens", () => {
    expect(verifyJwt("invalid.jwt.token")).toBeNull();
    expect(verifyJwt("")).toBeNull();
  });
});
