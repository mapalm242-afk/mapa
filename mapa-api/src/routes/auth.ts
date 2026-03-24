import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import db from '../db/database.js';

const router = Router();

const LoginSchema = z.object({
  email: z.string().email('Email inválido.'),
  senha: z.string().min(1, 'Senha obrigatória.'),
});

router.post('/login', (req, res, next) => {
  try {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message });
      return;
    }

    const { email, senha } = parsed.data;
    const gestor = db.prepare('SELECT * FROM gestores WHERE email = ?').get(email) as any;

    if (!gestor || !bcrypt.compareSync(senha, gestor.senha)) {
      res.status(401).json({ error: 'Email ou senha incorretos.' });
      return;
    }

    const token = jwt.sign(
      { id: gestor.id, email: gestor.email, role: gestor.role, empresa_id: gestor.empresa_id },
      process.env.JWT_SECRET!,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: { id: gestor.id, email: gestor.email, role: gestor.role, empresa_id: gestor.empresa_id },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
