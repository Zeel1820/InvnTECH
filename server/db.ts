import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from '@shared/schema';
import * as dotenv from 'dotenv';

dotenv.config(); 
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set. Did you forget to provision a database?');
}

// Use a connection pool instead of a single connection for better performance in a server environment.
export const pool = mysql.createPool(process.env.DATABASE_URL);

export const db = drizzle(pool, { schema, mode: 'default' });
