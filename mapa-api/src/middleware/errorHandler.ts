import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  console.error('[ERROR]', err.message, err.stack);

  // SQLite-specific errors
  if (err.message?.includes('UNIQUE constraint')) {
    res.status(409).json({ error: 'Recurso já existe (conflito de chave única).' });
    return;
  }
  if (err.message?.includes('FOREIGN KEY constraint')) {
    res.status(400).json({ error: 'Referência inválida a um recurso inexistente.' });
    return;
  }

  res.status(500).json({ error: 'Erro interno do servidor. Tente novamente.' });
}
