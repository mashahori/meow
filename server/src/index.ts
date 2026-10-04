import 'dotenv/config';
import express, { Application, Request, Response } from 'express';
import { pool } from './db/pool';
import { createUser, findUser } from './services/user';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app: Application = express();
const PORT = Number(process.env.PORT ?? 3000);

app.get('/', (req: Request, res: Response) => {
  res.send('Hello, TypeScript + Express!');
});

// Регистрация
app.post('/register', async (req, res) => {
  const { email, password } = req.body;
  if (await findUser(email)) return res.status(400).json({ message: 'User already exists' });

  await createUser(email, password);
  res.json({ message: 'User registered' });
});

// Логин
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await findUser(email);
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  const match = await git.compare(password, user.password_hash);
  if (!match) return res.status(401).json({ message: 'Invalid credentials' });

  const token = jwt.sign({ email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES,
  });

  res.json({ token });
});

// Middleware проверки токена
function authMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);
 
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user; // в user лежит payload токена
    next();
  });
}

// Пример защищённого маршрута
app.get('/profile', authMiddleware, (req, res) => {
  res.json({ message: `Hello, ${req.user.email}!` });
});

async function start() {
  await pool.query('SELECT 1');

  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

start().catch((error) => {
  console.error('Failed to start server', error);
  process.exitCode = 1;
});
