import { Router } from "express";
import { getDB } from "../db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuid } from "uuid";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

// Register
router.post("/register", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: "用户名和密码必填" });

  const db = getDB();
  const existing = db.prepare("SELECT id FROM users WHERE username = ?").get(username);
  if (existing) return res.status(409).json({ error: "用户名已存在" });

  const id = uuid();
  const hash = await bcrypt.hash(password, 10);
  db.prepare("INSERT INTO users (id, username, password, created_at) VALUES (?, ?, ?, ?)").run(id, username, hash, new Date().toISOString());

  const token = jwt.sign({ userId: id, username }, JWT_SECRET, { expiresIn: "365d" });
  res.json({ token, userId: id, username });
});

// Login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: "用户名和密码必填" });

  const db = getDB();
  const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
  if (!user) return res.status(401).json({ error: "用户名或密码错误" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: "用户名或密码错误" });

  const token = jwt.sign({ userId: user.id, username }, JWT_SECRET, { expiresIn: "365d" });
  res.json({ token, userId: user.id, username });
});

// Auth middleware
export function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: "未登录" });
  try {
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : auth;
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ error: "登录已过期" });
  }
}

export default router;
