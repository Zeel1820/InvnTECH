import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export function generateSKU(itemName: string): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  const prefix = itemName
    .replace(/[^a-zA-Z0-9]/g, '')
    .substring(0, 3)
    .toUpperCase() || 'ITM';
  
  return `${prefix}-${timestamp}-${random}`;
}

export function verifyQRToken(token: string, secret: string): any | null {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
}

export function generateBatchQRToken(batchId: string, batchNumber: string, itemId: string): { token: string; secret: string } {
  const secret = crypto.randomBytes(32).toString('hex');
  
  const token = jwt.sign(
    {
      batchId,
      batchNumber,
      itemId,
      type: 'batch',
      iat: Math.floor(Date.now() / 1000),
    },
    secret,
    { expiresIn: '10y' }
  );
  
  return { token, secret };
}

export function generateSerialQRToken(serialId: string, serialNumber: string, itemId: string): { token: string; secret: string } {
  const secret = crypto.randomBytes(32).toString('hex');
  
  const token = jwt.sign(
    {
      serialId,
      serialNumber,
      itemId,
      type: 'serial',
      iat: Math.floor(Date.now() / 1000),
    },
    secret,
    { expiresIn: '10y' }
  );
  
  return { token, secret };
}

export function generateSerialNumbers(startIndex: string, quantity: number): string[] {
  const serialNumbers: string[] = [];
  
  for (let i = 0; i < quantity; i++) {
    const serialNumber = `${startIndex}-${String(i + 1).padStart(4, '0')}`;
    serialNumbers.push(serialNumber);
  }
  
  return serialNumbers;
}
