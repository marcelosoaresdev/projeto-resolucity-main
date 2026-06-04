# RF004 - Cadastro de Usuário Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar cadastro de usuário com confirmação de email, hash scrypt e validação de senha segura.

**Architecture:** Backend Express com repository JSON, Nodemailer para envio de emails, crypto.scrypt para hash de senhas, status de usuário pendente/confirmation token para controle de ativação.

**Tech Stack:** Node.js, Express, crypto (native), nodemailer, uuid, JSON file storage

---

## 1. File Structure

### Existing Files to Modify

| Arquivo | Responsabilidade |
|---------|------------------|
| `src/repositories/userRepository.js` | Add hash scrypt, status, confirmationToken |
| `src/controllers/authController.js` | Register com confirmação, login com status check, endpoint confirm |
| `src/routes/authRoutes.js` | Add GET /confirm/:token |
| `src/database/users.json` | Reset com novo schema (empty array) |
| `public/js/login.js` | Add campo confirmar senha, validações, sucesso |
| `public/views/login.html` | Add campo confirmar senha |
| `.env` | Add variáveis de email |
| `.env.example` | Documentar variáveis de email |

### New Files to Create

| Arquivo | Responsabilidade |
|---------|------------------|
| `src/utils/emailService.js` | Módulo de envio de email (Nodemailer) |
| `src/utils/tokenGenerator.js` | Helper para UUID + expiração |

### Dependencies to Install

```bash
npm install nodemailer uuid
```

---

## 2. Task Decomposition

### Task 1: tokenGenerator.js

**Files:**
- Create: `src/utils/tokenGenerator.js`

- [ ] **Step 1: Create tokenGenerator.js**

```js
import { v4 as uuidv4 } from 'uuid';

const TOKEN_EXPIRATION_HOURS = 24;

// Gera um novo confirmation token com timestamp de expiração
function generateConfirmationToken() {
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRATION_HOURS * 60 * 60 * 1000);
    return { token, expiresAt: expiresAt.toISOString() };
}

// Verifica se um token expirou
function isTokenExpired(expiresAt) {
    return new Date(expiresAt) < new Date();
}

export { generateConfirmationToken, isTokenExpired, TOKEN_EXPIRATION_HOURS };
```

- [ ] **Step 2: Commit**

```bash
git add src/utils/tokenGenerator.js
git commit -m "feat(rf004): add tokenGenerator utility for confirmation tokens"
```

---

### Task 2: emailService.js

**Files:**
- Create: `src/utils/emailService.js`
- Modify: `.env` (variables), `.env.example` (document)

- [ ] **Step 1: Create emailService.js**

```js
import nodemailer from 'nodemailer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Carrega variáveis do .env
const envPath = join(__dirname, '../../.env');
import fs from 'fs';
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length) {
        envVars[key.trim()] = valueParts.join('=').trim();
    }
});

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || envVars.EMAIL_HOST,
    port: process.env.EMAIL_PORT || envVars.EMAIL_PORT || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
        user: process.env.EMAIL_USER || envVars.EMAIL_USER,
        pass: process.env.EMAIL_PASS || envVars.EMAIL_PASS
    }
});

async function sendConfirmationEmail(to, nome, token) {
    const baseUrl = process.env.BASE_URL || envVars.BASE_URL || 'http://localhost:3000';
    const confirmUrl = `${baseUrl}/confirmar?token=${token}`;

    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0c0c0c;">Bem-vindo ao Resolucity!</h2>
        <p>Olá, ${nome}.</p>
        <p>Clique no botão abaixo para confirmar seu cadastro:</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="${confirmUrl}" style="background-color: #ffcc00; color: #0c0c0c; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Confirmar Email</a>
        </div>
        <p>Ou copie este link: <a href="${confirmUrl}">${confirmUrl}</a></p>
        <p style="color: #666; font-size: 12px;">Este link expira em 24 horas.</p>
    </div>
    `;

    return transporter.sendMail({
        from: process.env.EMAIL_FROM || envVars.EMAIL_FROM || '"Resolucity" <noreply@resolucity.com.br>',
        to,
        subject: 'Confirme seu cadastro no Resolucity',
        html
    });
}

export { sendConfirmationEmail };
```

- [ ] **Step 2: Update .env with email variables**

Add to `.env`:
```
EMAIL_HOST=smtp.seudominio.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=noreply@seudominio.com.br
EMAIL_PASS=sua_senha_aqui
EMAIL_FROM="Resolucity <noreply@seudominio.com.br>"
BASE_URL=http://localhost:3000
```

- [ ] **Step 3: Update .env.example**

Add same variables to `.env.example` (without actual values, just comments).

- [ ] **Step 4: Commit**

```bash
git add src/utils/emailService.js .env .env.example
git commit -m "feat(rf004): add emailService with Nodemailer for confirmation emails"
```

---

### Task 3: userRepository.js - Hash and Status

**Files:**
- Modify: `src/repositories/userRepository.js`

- [ ] **Step 1: Update userRepository.js with scrypt hash and status**

Replace the entire file with:

```js
import fs from 'fs';
import crypto from 'crypto';

const DB_PATH = './src/database/users.json';
const SALT_LENGTH = 16;

// Helper: gera salt aleatório
function generateSalt() {
    return crypto.randomBytes(SALT_LENGTH).toString('hex');
}

// Helper: hash scrypt com salt
function hashPassword(password, salt) {
    const hash = crypto.scryptSync(password, salt, 32);
    return `${salt}:${hash.toString('hex')}`;
}

// Helper: verifica senha
function verifyPassword(password, storedHash) {
    const [salt, hash] = storedHash.split(':');
    const testHash = crypto.scryptSync(password, salt, 32).toString('hex');
    return hash === testHash;
}

const userRepository = {

    createUser: (nome, email, senha, confirmationToken, confirmationExpiresAt) => {
        const users = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));

        if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
            return { error: 'Este e-mail já está cadastrado' };
        }

        const hashedPassword = hashPassword(senha, generateSalt());

        // Gera próximo ID baseado no maior ID existente
        const maxId = users.reduce((max, u) => Math.max(max, u.id || 0), 0);

        const newUser = {
            id: maxId + 1,
            nome,
            email,
            senha: hashedPassword,
            status: 'pendente_confirmacao',
            confirmationToken,
            confirmationExpiresAt,
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        fs.writeFileSync(DB_PATH, JSON.stringify(users, null, 2));
        return { newUser, message: 'Cadastro realizado! Verifique seu email.' };
    },

    findByEmail: (email) => {
        const users = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
        return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
    },

    findById: (id) => {
        const users = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
        return users.find(u => u.id === id) || null;
    },

    findByConfirmationToken: (token) => {
        const users = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
        return users.find(u => u.confirmationToken === token) || null;
    },

    activateUser: (token) => {
        const users = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
        const idx = users.findIndex(u => u.confirmationToken === token);
        if (idx === -1) return { error: 'Link inválido.' };

        const user = users[idx];
        if (user.status === 'ativo') return { error: 'Link já utilizado. Faça login normalmente.' };
        if (new Date(user.confirmationExpiresAt) < new Date()) return { error: 'Link expirado. Solicite um novo.' };

        users[idx] = {
            ...users[idx],
            status: 'ativo',
            confirmationToken: null,
            confirmationExpiresAt: null
        };

        fs.writeFileSync(DB_PATH, JSON.stringify(users, null, 2));
        return { user: users[idx], message: 'Conta ativada com sucesso!' };
    },

    updateUser: (id, data) => {
        const users = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
        const idx = users.findIndex(u => u.id === id);
        if (idx === -1) return { error: 'Usuário não encontrado' };
        users[idx] = { ...users[idx], ...data };
        fs.writeFileSync(DB_PATH, JSON.stringify(users, null, 2));
        return { user: users[idx] };
    },

    listUsers: () => {
        return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    }
};

export default userRepository;
```

- [ ] **Step 2: Commit**

```bash
git add src/repositories/userRepository.js
git commit -m "feat(rf004): add scrypt hash, status, and confirmation token support"
```

---

### Task 4: authController.js - Register, Confirm, Login Updated

**Files:**
- Modify: `src/controllers/authController.js`

- [ ] **Step 1: Update authController.js**

Replace the entire file with:

```js
import userRepository from "../repositories/userRepository.js";
import { generateConfirmationToken } from "../utils/tokenGenerator.js";
import { sendConfirmationEmail } from "../utils/emailService.js";

const authController = {

    // Validações de input
    validateName(nome) {
        if (!nome || typeof nome !== 'string') return 'Nome é obrigatório';
        const trimmed = nome.trim();
        if (trimmed.length < 3) return 'Nome deve ter pelo menos 3 caracteres';
        if (trimmed !== nome) return 'Nome não pode ter espaços no início ou fim';
        return null;
    },

    validateEmail(email) {
        if (!email || typeof email !== 'string') return 'E-mail é obrigatório';
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!regex.test(email)) return 'Digite um e-mail válido';
        return null;
    },

    validatePassword(senha) {
        if (!senha || typeof senha !== 'string') return 'Senha é obrigatória';
        if (senha.length < 8) return 'A senha deve ter 8+ caracteres, letra e número';
        if (!/[a-zA-Z]/.test(senha)) return 'A senha deve ter 8+ caracteres, letra e número';
        if (!/[0-9]/.test(senha)) return 'A senha deve ter 8+ caracteres, letra e número';
        if (/\s/.test(senha)) return 'A senha não pode ter espaços';
        return null;
    },

    // POST /api/auth/register
    async register(req, res) {
        const { nome, email, senha } = req.body;

        // Valida campos obrigatórios
        if (!nome || !email || !senha) {
            return res.status(400).json({ message: 'Preencha todos os campos' });
        }

        // Validações
        const nameError = authController.validateName(nome);
        if (nameError) return res.status(400).json({ message: nameError });

        const emailError = authController.validateEmail(email);
        if (emailError) return res.status(400).json({ message: emailError });

        const passwordError = authController.validatePassword(senha);
        if (passwordError) return res.status(400).json({ message: passwordError });

        // Gera confirmation token
        const { token, expiresAt } = generateConfirmationToken();

        // Cria usuário pendente
        const result = userRepository.createUser(nome, email, senha, token, expiresAt);

        if (result.error) {
            return res.status(409).json({ message: result.error });
        }

        // Envia email de confirmação (async, não bloqueia resposta)
        sendConfirmationEmail(email, nome, token).catch(err => {
            console.error('Erro ao enviar email de confirmação:', err);
        });

        res.status(201).json({ message: 'Cadastro realizado! Verifique seu email.', userId: result.newUser.id });
    },

    // GET /api/auth/confirm/:token
    confirm(req, res) {
        const { token } = req.params;

        if (!token) {
            return res.status(400).json({ message: 'Token inválido.' });
        }

        const result = userRepository.activateUser(token);

        if (result.error) {
            return res.status(400).json({ message: result.error });
        }

        res.json({ message: result.message });
    },

    // POST /api/auth/login
    login(req, res) {
        const { email, senha } = req.body;

        if (!email || !senha) {
            return res.status(400).json({ message: 'Preencha todos os campos' });
        }

        const user = userRepository.findByEmail(email);

        if (!user) {
            return res.status(401).json({ message: 'E-mail ou senha incorretos' });
        }

        // Verifica se a senha está em formato antigo (plaintext) ou novo (hash)
        let passwordValid = false;
        if (user.senha.includes(':')) {
            // Novo formato salt:hash
            passwordValid = verifyPassword(senha, user.senha);
        } else {
            // Formato antigo plaintext (compatibilidade)
            passwordValid = (user.senha === senha);
        }

        if (!passwordValid) {
            return res.status(401).json({ message: 'E-mail ou senha incorretos' });
        }

        // Verifica status
        if (user.status === 'pendente_confirmacao') {
            return res.status(401).json({ message: `Faça a confirmação pelo email que enviamos para ${user.email}` });
        }

        if (user.status !== 'ativo') {
            return res.status(401).json({ message: 'Conta não está ativa. Entre em contato com suporte.' });
        }

        // Credenciais corretas e conta ativa
        req.session.userId = user.id;
        req.session.userName = user.nome;

        res.json({ message: 'Login realizado com sucesso', user: { id: user.id, nome: user.nome, email: user.email } });
    },

    // POST /api/auth/logout
    logout(req, res) {
        req.session.destroy(() => {
            res.json({ message: 'Logout realizado' });
        });
    },

    // GET /api/auth/me
    me(req, res) {
        if (!req.session.userId) {
            return res.status(401).json({ message: 'Não autenticado' });
        }
        res.json({ id: req.session.userId, nome: req.session.userName });
    },

    // GET /api/auth/profile
    getProfile(req, res) {
        const userId = req.session.userId;
        if (!userId) return res.status(401).json({ message: 'Não autenticado' });
        const user = userRepository.findById(userId);
        if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });
        res.json({ id: user.id, nome: user.nome, email: user.email, cpf: user.cpf, nascimento: user.nascimento, telefone: user.telefone });
    },

    // PUT /api/auth/profile
    updateProfile(req, res) {
        const userId = req.session.userId;
        if (!userId) return res.status(401).json({ message: 'Não autenticado' });
        const { nome, cpf, nascimento, telefone, email } = req.body;
        if (!nome || !cpf || !nascimento || !telefone || !email) {
            return res.status(400).json({ message: 'Preencha todos os campos' });
        }
        const result = userRepository.updateUser(userId, { nome, cpf, nascimento, telefone, email });
        if (result.error) return res.status(400).json({ message: result.error });
        req.session.userName = nome;
        res.json({ message: 'Perfil atualizado', user: result.user });
    },

    // GET /api/auth/
    listUsers(req, res) {
        res.json(userRepository.listUsers());
    }

};

// Helper para verificar senha (importado no login)
function verifyPassword(password, storedHash) {
    const [salt, hash] = storedHash.split(':');
    const testHash = crypto.scryptSync(password, salt, 32).toString('hex');
    return hash === testHash;
}

export default authController;
```

- [ ] **Step 2: Commit**

```bash
git add src/controllers/authController.js
git commit -m "feat(rf004): update authController with email confirmation flow"
```

---

### Task 5: authRoutes.js - Add confirm endpoint

**Files:**
- Modify: `src/routes/authRoutes.js`

- [ ] **Step 1: Update authRoutes.js**

```js
import { Router } from 'express';
import authController from '../controllers/authController.js';

const authRoutes = Router();

authRoutes.post('/register', authController.register);
authRoutes.post('/login',    authController.login);
authRoutes.post('/logout',   authController.logout);
authRoutes.get('/me',        authController.me);
authRoutes.get('/profile',   authController.getProfile);
authRoutes.put('/profile',   authController.updateProfile);
authRoutes.get('/',           authController.listUsers);
authRoutes.get('/confirm/:token', authController.confirm); // NOVO

export default authRoutes;
```

- [ ] **Step 2: Commit**

```bash
git add src/routes/authRoutes.js
git commit -m "feat(rf004): add GET /confirm/:token route"
```

---

### Task 6: Frontend - login.html + login.js

**Files:**
- Modify: `public/views/login.html`
- Modify: `public/js/login.js`

- [ ] **Step 1: Update login.html - add confirm password field**

Find the register form section and add confirm password field after password field:

```html
<!-- Adicionar depois do campo register-password -->
<div class="mb-3">
    <label for="register-confirm-password" class="form-label">Confirmar Senha</label>
    <input type="password" class="form-control" id="register-confirm-password" placeholder="Repita a senha" required>
    <span id="register-confirm-password-error" class="error"></span>
</div>
```

- [ ] **Step 2: Update login.js - add confirm password validation and new success flow**

Replace the register form submit handler section:

```js
// ================================================
// FORMULÁRIO DE CADASTRO
// ================================================

document.getElementById('registerForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    clearAllErrors('registerForm');

    const nome = document.getElementById('register-name').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const senha = document.getElementById('register-password').value;
    const confirmarSenha = document.getElementById('register-confirm-password').value;

    // 1. Valida os campos antes de enviar
    let hasError = false;

    if (!nome) {
        showError('register-name', 'Por favor, insira seu nome completo');
        hasError = true;
    } else if (!validateName(nome)) {
        showError('register-name', 'Nome deve ter pelo menos 3 caracteres');
        hasError = true;
    }

    if (!email) {
        showError('register-email', 'Por favor, insira seu e-mail');
        hasError = true;
    } else if (!validateEmail(email)) {
        showError('register-email', 'E-mail inválido');
        hasError = true;
    }

    if (!senha) {
        showError('register-password', 'Por favor, insira uma senha');
        hasError = true;
    } else if (!validatePassword(senha)) {
        showError('register-password', 'A senha deve ter 8+ caracteres, letra e número');
        hasError = true;
    }

    if (!confirmarSenha) {
        showError('register-confirm-password', 'Por favor, confirme sua senha');
        hasError = true;
    } else if (senha !== confirmarSenha) {
        showError('register-confirm-password', 'As senhas não coincidem');
        hasError = true;
    }

    if (hasError) return;

    // 2. Envia para o backend
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, email, senha })
        });

        const data = await response.json();

        // 3a. Erro (ex: email já cadastrado): mostra abaixo do campo de email
        if (!response.ok) {
            showError('register-email', data.message);
            return;
        }

        // 3b. Cadastro ok: mostra mensagem de confirmação
        showSuccessModal(
            'Cadastro realizado!',
            data.message,
            () => {
                document.getElementById('registerForm').reset();
                showLogin();
            }
        );

    } catch (err) {
        showError('register-email', 'Erro de conexão com o servidor');
    }
});

// Atualizar validatePassword para novos critérios
function validatePassword(password) {
    if (password.length < 8) return false;
    if (!/[a-zA-Z]/.test(password)) return false;
    if (!/[0-9]/.test(password)) return false;
    if (/\s/.test(password)) return false;
    return true;
}
```

- [ ] **Step 3: Commit**

```bash
git add public/views/login.html public/js/login.js
git commit -m "feat(rf004): add confirm password field and validation"
```

---

### Task 7: Reset users.json

**Files:**
- Modify: `src/database/users.json`

- [ ] **Step 1: Reset users.json**

Reset the file to an empty users array with no legacy data:

```json
[]
```

- [ ] **Step 2: Commit**

```bash
git add src/database/users.json
git commit -m "chore(rf004): reset users.json for new schema"
```

---

### Task 8: Install dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install nodemailer and uuid**

```bash
npm install nodemailer uuid
```

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat(rf004): add nodemailer and uuid dependencies"
```

---

## 3. Spec Coverage Check

| Requisito RF004 | Task que implementa |
|-----------------|---------------------|
| Nome, email, senha obrigatórios | Task 4 (authController validate) |
| Confirmação de senha no formulário | Task 6 |
| Validação de email (formato) | Task 4 |
| Email único | Task 3 (userRepository) |
| Critérios de senha (8+ chars, letra, número) | Task 4 |
| Hash scrypt | Task 3 |
| Status pendente_confirmacao | Task 3 |
| Confirmation token UUID | Task 1 |
| Email de confirmação | Task 2 |
| Endpoint confirm/:token | Task 5 |
| Bloquear login se pendente | Task 4 |
| Template email HTML | Task 2 |

---

## 4. Dependencies

- nodemailer (envio de email)
- uuid (confirmation tokens)

---

## 5. Environment Variables Required

```
EMAIL_HOST=smtp.seudominio.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=noreply@seudominio.com.br
EMAIL_PASS=sua_senha_aqui
EMAIL_FROM="Resolucity <noreply@seudominio.com.br>"
BASE_URL=http://localhost:3000
```

---

## Execution

**Plan complete and saved to `docs/superpowers/plans/2026-06-04-rf004-cadastro-usuario-implementacao.md`**

**Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**