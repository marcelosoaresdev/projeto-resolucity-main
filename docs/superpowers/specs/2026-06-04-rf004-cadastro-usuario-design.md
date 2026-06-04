# SPEC: RF004 - Cadastro de Usuário

## 1. Visão Geral

**Requisito:** RF004 — Cadastro de Usuário
**Objetivo:** Permitir que novos usuários se cadastrem na plataforma com validação de email e senha segura.
**Stack:** Node.js + Express + JSON file storage + crypto.scrypt

---

## 2. Fluxo Principal

```
[Cadastro via formulário]
       ↓
[Backend valida campos + cria usuário pendente]
       ↓
[Gera confirmationToken UUID v4]
       ↓
[Envia email com link de confirmação]
       ↓
[Usuário clica no link]
       ↓
[Backend valida token → ativa conta (status: "ativo")]
       ↓
[Usuário faz login normalmente]
```

---

## 3. Modelo de Dados

### users.json — campos novos

```json
{
  "id": 1,
  "nome": "João Silva",
  "email": "joao@email.com",
  "senha": "$scrypt$...",  // hash scrypt (NÃO mais plaintext)
  "status": "pendente_confirmacao",  // pendente_confirmacao | ativo
  "confirmationToken": "uuid-v4-unico",  // expira em 24h
  "createdAt": "2026-06-04T12:00:00.000Z"
}
```

### Validação de Status

| Status | Login permitido? | Ações permitidas |
|--------|------------------|------------------|
| `pendente_confirmacao` | NÃO | Verificar email |
| `ativo` | SIM | Todas |

---

## 4. Backend — Endpoints

### POST /api/auth/register

**Entrada:**
```json
{ "nome": "João Silva", "email": "joao@email.com", "senha": "MinhaSenh@123" }
```

**Validações:**
- `nome`: obrigatório, 3+ caracteres, sem espaços em branco no início/fim
- `email`: obrigatório, formato válido, único no banco
- `senha`: obrigatório, 8+ chars, pelo menos 1 letra e 1 número, sem espaços

**Respostas:**
- `201`: `{ message: "Cadastro realizado! Verifique seu email.", userId: 1 }`
- `400`: `{ message: "Preencha todos os campos" }`
- `409`: `{ message: "Este e-mail já está cadastrado" }`

**Efeito colateral:** Gera `confirmationToken` + envia email de confirmação.

---

### GET /api/auth/confirm/:token

**Entrada:** Token UUID v4 na URL

**Validações:**
- Token existe no banco?
- Token não expirou (24h)?
- Status já é `ativo`?

**Respostas:**
- `200`: `{ message: "Conta ativada com sucesso!" }` → redireciona para login
- `400`: `{ message: "Link expirado. Solicite um novo." }`
- `404`: `{ message: "Link inválido." }`

---

### POST /api/auth/login (alterado)

**Validação adicional:** Verifica `status === "ativo"`

**Resposta quando pendente:**
```json
{ "message": "Faça a confirmação pelo email que enviamos para joao@email.com" }
```

---

## 5. Backend — Hash de Senha

### Uso do crypto.scrypt

```js
import crypto from 'crypto';

// Geração de hash
const hash = crypto.scryptSync(senha, 'salt', 32).toString('hex');

// Verificação
const isValid = crypto.scryptSync(senha, 'salt', 32).toString('hex') === storedHash;
```

**Formato armazenamento:** `salt:hash` (permite rotação de salt no futuro)

---

## 6. Critérios de Validação

### Nome
- Obrigatório
- Mínimo 3 caracteres após trim
- Sem espaços em branco apenas

### Email
- Formato: `usuario@dominio.com`
- Uso de regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- Unique no banco (case insensitive)

### Senha
- Mínimo 8 caracteres
- Pelo menos 1 letra (a-z, A-Z)
- Pelo menos 1 número (0-9)
- Sem espaços em branco

---

## 7. Frontend — Formulário de Cadastro

### Campos

| Campo | Tipo | Placeholder | Validação |
|-------|------|-------------|-----------|
| Nome | text | "Seu nome completo" | 3+ caracteres |
| Email | email | "seu@email.com" | formato válido |
| Senha | password | "Mínimo 8 caracteres, letra e número" | 8+ chars, letra, número |
| Confirmar Senha | password | "Repita a senha" | deve ser igual à senha |

### Mensagens de Erro Inline

- Campo inválido → borda vermelha + texto abaixo do campo
- Email duplicado → abaixo do campo email
- Senhas diferentes → abaixo do campo "confirmar senha"

### Estado de Sucesso

Ao cadastrar com sucesso:
- Modal ou área de mensagem
- Texto: "Cadastro realizado! Verifique seu email para confirmar sua conta."
- NÃO redireciona para login automaticamente
- Botão "Ir para Login" opcional (mas não auto-redirect)

---

## 8. Sistema de Email

### Configuração (environment variables)

```env
EMAIL_HOST=smtp.exemplo.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=noreply@resolucity.com.br
EMAIL_PASS=senha
EMAIL_FROM="Resolucity <noreply@resolucity.com.br>"
BASE_URL=http://localhost:3000
```

### Template do Email

**Assunto:** Confirme seu cadastro no Resolucity

**Corpo (HTML):**
```html
<h2>Bem-vindo ao Resolucity!</h2>
<p>Olá, {nome}.</p>
<p>Clique no botão abaixo para confirmar seu cadastro:</p>
<a href="{baseUrl}/confirmar?token={token}" style="...">Confirmar Email</a>
<p>Ou copie este link: {baseUrl}/confirmar?token={token}</p>
<p>Este link expira em 24 horas.</p>
```

### Casos de Erro no Token

| Situação | Mensagem | Ação |
|----------|----------|------|
| Token expirado | "Este link expirou." | Link para reenviar email |
| Token já usado | "Este link já foi utilizado." | "Faça login normalmente" |
| Token inválido | "Link inválido." | "Solicite um novo email" |

---

## 9. Casos de Erro — Resumo

| Cenário | HTTP Status | Mensagem |
|---------|-------------|----------|
| Campos obrigatórios vazios | 400 | "Preencha todos os campos" |
| Email já cadastrado | 409 | "Este e-mail já está cadastrado" |
| Email inválido | 400 | "Digite um e-mail válido" |
| Nome muito curto | 400 | "Nome deve ter pelo menos 3 caracteres" |
| Senha fraca | 400 | "A senha deve ter 8+ caracteres, letra e número" |
| Senhas diferentes | 400 | "As senhas não coincidem" |
| Login com conta pendente | 401 | "Faça a confirmação pelo email que enviamos para {email}" |
| Token expirado | 400 | "Este link expirou. Solicite um novo." |
| Token inválido | 404 | "Link inválido ou já utilizado." |

---

## 10. Arquivos a Alterar

| Arquivo | Ação |
|---------|------|
| `src/repositories/userRepository.js` | Add hash scrypt, status, confirmationToken |
| `src/controllers/authController.js` | Add validações, confirmação de email, novo endpoint confirm |
| `src/routes/authRoutes.js` | Add GET /confirm/:token |
| `src/database/users.json` | Reset com novo schema (migration seed) |
| `public/js/login.js` | Add campo confirmar senha, validações, sucesso |
| `public/views/login.html` | Add campo confirmar senha |
| `.env` | Add variáveis de email |
| `.env.example` | Documentar variáveis de email |

---

## 11. Arquivos a Criar

| Arquivo | Descrição |
|---------|-----------|
| `src/utils/emailService.js` | Módulo de envio de email (Nodemailer) |
| `src/utils/tokenGenerator.js` | Helper para UUID + expiração |

---

## 12. Dependências a Adicionar

```bash
npm install nodemailer uuid
```

---

## 13. Considerações

- O token é um UUID v4 único gerado no momento do cadastro
- Validade do token: 24 horas
- Ao confirmar, o `confirmationToken` é limpo (ou marcado como usado)
- Não usar `crypto` nativo para hashing — usar `crypto.scrypt` com salt por usuário
- Armazenar `salt:hash` para permitir futuramente migração de algoritmo
- Rate limit no endpoint de reenvio de email: máximo 3 por hora por IP

---

## 14. Status do Usuário — Estados

```
[Usuário criado]
    ↓
status: "pendente_confirmacao"
confirmationToken: "uuid-xxx"
    ↓
[Usuário clica link]
    ↓
status: "ativo"
confirmationToken: null (limpo)
    ↓
[Login permitido]
```