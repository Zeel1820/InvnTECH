'use strict';

import express from 'express';
import session from 'express-session';
import { DrizzleMySQLAdapter } from '@lucia-auth/adapter-drizzle';
import { db } from './db';
import { sessions, users } from '../../shared/schema';

import authRouter from './routes/auth';
import usersRouter from './routes/users';

declare module 'express-session' {
  interface SessionData {
    user: Omit<typeof users.$inferSelect, 'password'>;
  }
}

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(
  session({
    store: new DrizzleMySQLAdapter(db, sessions, users),
    secret: process.env.SESSION_SECRET || 'a-very-strong-secret-that-is-at-least-32-characters-long',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  })
);

// Routes
app.get('/', (req, res) => {
  res.send('Server is running!');
});

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);

// Start server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
