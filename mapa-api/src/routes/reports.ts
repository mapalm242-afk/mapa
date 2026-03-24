import { Router } from 'express';
import db from '../db/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// GET /reports/pgr — PGR compliance data
router.get('/pgr', authMiddleware, (req, res, next) => {
  try {
    const empresa_id = req.user!.role === 'admin'
      ? req.query.empresa_id
      : req.user!.empresa_id;

    if (!empresa_id) {
      res.status(400).json({ error: 'empresa_id é obrigatório para admin.' });
      return;
    }

    const empresa = db.prepare('SELECT * FROM empresas WHERE id = ?').get(Number(empresa_id)) as any;
    if (!empresa) {
      res.status(404).json({ error: 'Empresa não encontrada.' });
      return;
    }

    const escalas = db.prepare(`
      SELECT ec.*, s.nome as setor_nome
      FROM escalas_calculadas ec
      JOIN setores s ON s.id = ec.setor_id
      WHERE ec.empresa_id = ?
      ORDER BY ec.nivel_risco DESC, ec.score_medio DESC
    `).all(Number(empresa_id)) as any[];

    const totalRespostas = escalas.reduce((acc, e) => acc + e.total_respostas, 0);
    const riscoCounts = { Vermelho: 0, Amarelo: 0, Verde: 0 };
    for (const e of escalas) {
      riscoCounts[e.nivel_risco as keyof typeof riscoCounts]++;
    }

    res.json({
      empresa: { id: empresa.id, nome: empresa.nome, cnpj: empresa.cnpj },
      gerado_em: new Date().toISOString(),
      resumo: {
        total_setores: escalas.length,
        total_respostas: totalRespostas,
        risco_counts: riscoCounts,
      },
      dimensoes: escalas.map(e => ({
        setor: e.setor_nome,
        dimensao: e.dimensao,
        score: e.score_medio,
        risco: e.nivel_risco,
        n_respostas: e.total_respostas,
        ultima_atualizacao: e.updated_at,
      })),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
