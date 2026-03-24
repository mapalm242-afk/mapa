import { Router } from 'express';
import { z } from 'zod';
import db from '../db/database.js';
import { calcAverageScore, calcRisk } from '../lib/copsoq.js';

const router = Router();

// COPSOQ II dimensão label (mock for 5 questions)
const DIMENSOES = ['Ritmo de Trabalho'];

const SurveySchema = z.object({
  setor_id: z.number().int().positive('setor_id deve ser um inteiro positivo.'),
  respostas: z
    .array(z.number().int().min(1).max(5))
    .min(5, 'Mínimo de 5 respostas.')
    .max(40, 'Máximo de 40 respostas.'),
});

// POST /survey/submit — PUBLIC route
router.post('/submit', (req, res, next) => {
  try {
    const parsed = SurveySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message });
      return;
    }

    const { setor_id, respostas } = parsed.data;

    // Validate setor exists and get empresa_id
    const setor = db.prepare(
      'SELECT id, empresa_id FROM setores WHERE id = ?'
    ).get(setor_id) as { id: number; empresa_id: number } | undefined;

    if (!setor) {
      res.status(404).json({ error: 'Setor não encontrado.' });
      return;
    }

    // Insert anonymous response
    db.prepare(`
      INSERT INTO respostas_brutas (empresa_id, setor_id, respostas_json)
      VALUES (?, ?, ?)
    `).run(setor.empresa_id, setor_id, JSON.stringify(respostas));

    // Recalculate and upsert escalas_calculadas
    const todasRespostas = db.prepare(
      'SELECT respostas_json FROM respostas_brutas WHERE setor_id = ?'
    ).all(setor_id) as { respostas_json: string }[];

    // Aggregate all responses per question index
    const totalPerguntas = respostas.length;
    const somaPorPergunta: number[] = new Array(totalPerguntas).fill(0);
    const countRespostas = todasRespostas.length;

    for (const row of todasRespostas) {
      const arr: number[] = JSON.parse(row.respostas_json);
      arr.forEach((v, i) => { somaPorPergunta[i] = (somaPorPergunta[i] || 0) + v; });
    }

    const mediasGlobais = somaPorPergunta.map(soma => soma / countRespostas);
    const scoreGlobal = calcAverageScore(mediasGlobais);
    const risco = calcRisk(scoreGlobal);

    db.prepare(`
      INSERT INTO escalas_calculadas (empresa_id, setor_id, dimensao, score_medio, nivel_risco, total_respostas, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(setor_id, dimensao) DO UPDATE SET
        score_medio = excluded.score_medio,
        nivel_risco = excluded.nivel_risco,
        total_respostas = excluded.total_respostas,
        updated_at = excluded.updated_at
    `).run(setor.empresa_id, setor_id, 'Ritmo de Trabalho', scoreGlobal, risco, countRespostas);

    res.status(201).json({ message: 'Respostas registradas com sucesso. Obrigado!', setor_id });
  } catch (err) {
    next(err);
  }
});

export default router;
