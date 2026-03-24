import app from './app.js';

const PORT = Number(process.env.PORT ?? 3001);

app.listen(PORT, () => {
  console.log(`🚀 M.A.P.A. API rodando em http://localhost:${PORT}`);
  console.log(`   Ambiente: ${process.env.NODE_ENV}`);
});
