'use strict';

import express from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { users, upsertUserSchema } from '../../../shared/schema';
import { validate } from '../middleware/validate';
import bcrypt from 'bcryptjs';

const router = express.Router();

// Get all users
router.get('/', async (req, res) => {
  try {
    const allUsers = await db.select().from(users);
    res.json(allUsers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get a single user by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await db.select().from(users).where(eq(users.id, req.params.id)).limit(1);
    if (user.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create a new user
router.post('/', validate(upsertUserSchema), async (req, res) => {
  const { email, password, ...rest } = req.body;

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await db.insert(users).values({
      email,
      password: hashedPassword,
      ...rest
    });
    res.status(201).json(newUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update a user
router.put('/:id', validate(upsertUserSchema.partial()), async (req, res) => {
  const { id } = req.params;
  const { password, ...rest } = req.body;

  try {
    let hashedPassword;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    }

    const updatedUser = await db.update(users)
      .set({ ...(hashedPassword && { password: hashedPassword }), ...rest })
      .where(eq(users.id, id));

    if (updatedUser.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete a user
router.delete('/:id', async (req, res) => {
  try {
    const deletedUser = await db.delete(users).where(eq(users.id, req.params.id));
    if (deletedUser.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
