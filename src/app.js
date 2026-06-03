import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session';
import authRoutes from './routes/authRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import { requireAuthPage } from './middlewares/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.json());

// Sessão: mantém o usuário logado entre requisições
app.use(session({
    secret: 'resolucity-secret',  // chave para assinar o cookie (trocar em produção)
    resave: false,                // não salva a sessão se ela não foi modificada
    saveUninitialized: false,     // não cria sessão para quem não está logado
    cookie: { httpOnly: true }    // cookie não acessível via JavaScript no browser
}));
app.use(express.static(path.join(__dirname, '../')));
app.use(express.static(path.join(__dirname, '../public')));

app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);

app.get('/', (req, res) => {
    if (req.session.userId) return res.redirect('/meus-relatos');
    res.sendFile(path.join(__dirname, '../index.html'));
});
app.get('/login',        (req, res) => res.sendFile(path.join(__dirname, '../public/views/login.html')));
app.get('/categorias',  (req, res) => res.sendFile(path.join(__dirname, '../public/views/categorias.html')));
app.get('/estatisticas',(req, res) => res.sendFile(path.join(__dirname, '../public/views/estatisticas.html')));
app.get('/contato',     (req, res) => res.sendFile(path.join(__dirname, '../public/views/contato.html')));
app.get('/sobre',       (req, res) => res.sendFile(path.join(__dirname, '../public/views/sobre.html')));
app.get('/relatar',      (req, res) => res.sendFile(path.join(__dirname, '../public/views/relatar.html')));
app.get('/meus-relatos', requireAuthPage, (req, res) => res.sendFile(path.join(__dirname, '../public/views/meus-relatos.html')));

export default app;
