import CryptoJS from 'crypto-js';

/**
 * Decrypt data received from the Next.js API
 */
export function decryptData<T>(encryptedData: string): T {
  try {
    const ENCRYPTION_SECRET = process.env.NEXT_PUBLIC_ENCRYPTION_SECRET;
    
    if (!ENCRYPTION_SECRET) {
      throw new Error('Encryption secret not configured');
    }

    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_SECRET);
    const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
    
    if (!decryptedString) {
      throw new Error('Failed to decrypt data - invalid secret or corrupted data');
    }

    return JSON.parse(decryptedString) as T;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error(`Failed to decrypt response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Check if response is encrypted and handle accordingly
 */
export function handleEncryptedResponse<T>(response: any): T {
  if (response.encrypted && response.data) {
    return decryptData<T>(response.data);
  }
  
  // If not encrypted, return as-is (for backward compatibility)
  return response as T;
}