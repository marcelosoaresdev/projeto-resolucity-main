import app from './src/app.js';

const PORT = process.env.PORT || 3000;

// Inicia o servidor apenas em ambiente local (não na Vercel)
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
  });
}

export default app;
