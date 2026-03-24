import { Router } from 'express';
import db from '../db/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// GET /analytics/dashboard — returns escalas calculadas per setor (filtered by empresa)
router.get('/dashboard', authMiddleware, (req, res, next) => {
  try {
    const empresa_id = req.user!.role === 'admin'
      ? req.query.empresa_id
      : req.user!.empresa_id;

    if (!empresa_id) {
      res.status(400).json({ error: 'empresa_id é obrigatório para admin.' });
      return;
    }

    const rows = db.prepare(`
      SELECT 
        ec.id,
        ec.setor_id,
        s.nome as setor_nome,
        ec.dimensao,
        ec.score_medio,
        ec.nivel_risco,
        ec.total_respostas,
        ec.updated_at
      FROM escalas_calculadas ec
      JOIN setores s ON s.id = ec.setor_id
      WHERE ec.empresa_id = ?
      ORDER BY ec.score_medio DESC
    `).all(Number(empresa_id));

    // Also include sectors with no responses
    const setores = db.prepare(
      'SELECT id, nome FROM setores WHERE empresa_id = ?'
    ).all(Number(empresa_id)) as { id: number; nome: string }[];

    const result = setores.map(setor => {
      const calc = (rows as any[]).find(r => r.setor_id === setor.id);
      return {
        setor_id: setor.id,
        setor_nome: setor.nome,
        dimensao: calc?.dimensao ?? 'Ritmo de Trabalho',
        score_medio: calc?.score_medio ?? null,
        nivel_risco: calc?.nivel_risco ?? 'Sem dados',
        total_respostas: calc?.total_respostas ?? 0,
        updated_at: calc?.updated_at ?? null,
      };
    });

    res.json({ empresa_id: Number(empresa_id), setores: result });
  } catch (err) {
    next(err);
  }
});

export default router;
