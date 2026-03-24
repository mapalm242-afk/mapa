import { Router } from 'express';
import { z } from 'zod';
import db from '../db/database.js';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';

const router = Router();

const EmpresaSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres.'),
  cnpj: z.string().min(14, 'CNPJ inválido.'),
  logo_url: z.string().url().optional(),
});

// GET /empresas — admin only: list all companies with global risk
router.get('/', authMiddleware, requireAdmin, (req, res, next) => {
  try {
    const empresas = db.prepare(`
      SELECT e.*, 
        (SELECT nivel_risco FROM escalas_calculadas 
         WHERE empresa_id = e.id 
         ORDER BY CASE nivel_risco 
           WHEN 'Vermelho' THEN 1 
           WHEN 'Amarelo' THEN 2 
           ELSE 3 END LIMIT 1) as risco_global
      FROM empresas e
      ORDER BY e.nome
    `).all();
    res.json(empresas);
  } catch (err) {
    next(err);
  }
});

// POST /empresas — admin only: create company
router.post('/', authMiddleware, requireAdmin, (req, res, next) => {
  try {
    const parsed = EmpresaSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message });
      return;
    }

    const { nome, cnpj, logo_url } = parsed.data;
    const result = db.prepare(
      `INSERT INTO empresas (nome, cnpj, logo_url) VALUES (?, ?, ?) RETURNING *`
    ).get(nome, cnpj, logo_url ?? null) as any;

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
