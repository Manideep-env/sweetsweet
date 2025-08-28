// src/lib/get-seller-from-token.js
import { verifyToken } from './auth';

/**
 * Verifies the JWT from the request cookies and returns the decoded payload.
 * The payload contains the seller's information, including the crucial sellerId.
 * @param {Request} request The Next.js request object.
 * @returns {Promise<object|null>} The decoded token payload or null if invalid/missing.
 */
export async function getSellerFromToken(request) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return null;
    }
    
    const decodedPayload = await verifyToken(token);

    // Ensure the payload has the sellerId we need
    if (decodedPayload && decodedPayload.sellerId) {
      return decodedPayload;
    }

    return null;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}