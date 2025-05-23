import CryptoJS from "crypto-js";

const SECRET_KEY = "blockpay_secret"; // Replace with env-secure key

export function encryptWallet(walletAddress: string) {
  return CryptoJS.AES.encrypt(walletAddress, SECRET_KEY).toString();
}

export function decryptWallet(encrypted: string) {
  const bytes = CryptoJS.AES.decrypt(encrypted, SECRET_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}
