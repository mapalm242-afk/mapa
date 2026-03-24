import { Router } from 'express';
import { z } from 'zod';
import db from '../db/database.js';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';

const router = Router();

const SetorSchema = z.object({
  empresa_id: z.number().int().positive(),
  nome: z.string().min(2, 'Nome do setor deve ter pelo menos 2 caracteres.'),
});

// GET /setores — gestores see their own company's sectors
router.get('/', authMiddleware, (req, res, next) => {
  try {
    const empresa_id = req.user!.role === 'admin'
      ? req.query.empresa_id
      : req.user!.empresa_id;

    if (!empresa_id) {
      res.status(400).json({ error: 'empresa_id é obrigatório para admin.' });
      return;
    }

    const setores = db.prepare(
      `SELECT * FROM setores WHERE empresa_id = ? ORDER BY nome`
    ).all(Number(empresa_id));

    res.json(setores);
  } catch (err) {
    next(err);
  }
});

// POST /setores — admin only
router.post('/', authMiddleware, requireAdmin, (req, res, next) => {
  try {
    const parsed = SetorSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message });
      return;
    }

    const { empresa_id, nome } = parsed.data;
    const empresaExists = db.prepare('SELECT id FROM empresas WHERE id = ?').get(empresa_id);
    if (!empresaExists) {
      res.status(404).json({ error: 'Empresa não encontrada.' });
      return;
    }

    const result = db.prepare(
      `INSERT INTO setores (empresa_id, nome) VALUES (?, ?) RETURNING *`
    ).get(empresa_id, nome) as any;

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
