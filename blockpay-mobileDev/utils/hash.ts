// utils/hash.ts
import CryptoJS from "crypto-js";

const SALT = "blockpay_secret"; // TODO: load from env in prod

/**
 * Hashes a wallet address using SHA-256 with a salt.
 * @param walletAddress The plain wallet address to hash.
 * @returns The hex-encoded SHA-256 hash.
 */
export function hashWallet(walletAddress: string): string {
  return CryptoJS.SHA256(walletAddress + SALT).toString(CryptoJS.enc.Hex);
}
