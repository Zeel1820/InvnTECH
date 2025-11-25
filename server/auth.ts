import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { storage } from "./storage";

const JWT_SECRET = process.env.JWT_SECRET || "SUPER_SECRET_KEY";

/* ---------------------------------------- */
/* AUTH MIDDLEWARE                           */
/* ---------------------------------------- */

export const authMiddleware = (req: any, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, role }
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
};

/* ---------------------------------------- */
/* ROLE CHECK                                 */
/* ---------------------------------------- */

export const requireRole = (...roles: string[]) => {
  return (req: any, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
};

/* ---------------------------------------- */
/* LOGIN HANDLER                               */
/* ---------------------------------------- */

export const loginHandler = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await storage.getUserByEmail(email);
  if (!user) {
    return res.status(400).json({ message: "Invalid email or password" });
  }

  if (!user.password) {
    return res.status(400).json({ message: "User has no password set" });
  }

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    return res.status(400).json({ message: "Invalid email or password" });
  }

  const token = jwt.sign(
    { id: user.id, role: user.role },
    JWT_SECRET,
    { expiresIn: "1d" }
  );

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    }
  });
};
