import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "./config.js";

export type AuthUser = {
  id: string;
  email: string;
};

export type AuthRequest = Request & {
  user: AuthUser;
};

export function signAuthToken(user: AuthUser): string {
  return jwt.sign(user, config.jwtSecret, { expiresIn: "7d" });
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;

  if (!token) {
    res.status(401).json({ error: "Missing bearer token." });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as AuthUser;
    (req as AuthRequest).user = { id: decoded.id, email: decoded.email };
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token." });
  }
}
