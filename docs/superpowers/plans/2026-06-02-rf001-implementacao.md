# RF-001 — Cadastro de Ocorrência: Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar todas as melhorias do RF-001: perfil editável, formulário de relato com auto-preenchimento, campo tipo do problema, modal de sucesso com dois botões, e modal expandido em Meus Relatos.

**Architecture:** Backend Express com repositórios JSON, frontend vanilla JS com Axios. Dados do perfil via session, formulário consome `/api/auth/me` para auto-preencher. Novas rotas: PUT `/api/auth/profile` e GET `/perfil`.

**Tech Stack:** Node.js, Express, JSON file storage, vanilla JS, DaisyUI/Tailwind

---

## Visão Geral dos Arquivos

| Arquivo | Ação | Responsabilidade |
|---------|------|-----------------|
| `src/repositories/userRepository.js` | Modify | Adicionar `updateUser` e `findById` |
| `src/controllers/authController.js` | Modify | Adicionar `updateProfile` e `getProfile` |
| `src/routes/authRoutes.js` | Modify | Adicionar PUT `/profile` e GET `/profile` |
| `src/app.js` | Modify | Adicionar rota GET `/perfil` |
| `public/views/perfil.html` | Create | Página de edição do perfil |
| `public/js/perfil.js` | Create | Lógica de carregar/salvar perfil |
| `public/views/relatar.html` | Modify | Remover campos redundantes, adicionar tipo |
| `public/js/relatar.js` | Modify | Auto-preenchimento + campo tipo dinâmico |
| `public/views/meus-relatos.html` | Modify | Botão fixo topo |
| `public/js/meus-relatos.js` | Modify | Modal expandido + overflow |
| `src/database/reports.json` | Modify | Adicionar campo `tipo` e timestamp completo |

---

## Tarefas

### Task 1: Perfil — Backend (userRepository + authController + routes)

**Files:**
- Modify: `src/repositories/userRepository.js`
- Modify: `src/controllers/authController.js`
- Modify: `src/routes/authRoutes.js`

- [ ] **Step 1: Adicionar método `findById` no userRepository**

Em `src/repositories/userRepository.js`, adicionar método:

```javascript
findById: (id) => {
    const users = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    return users.find(u => u.id === id) || null;
}
```

- [ ] **Step 2: Adicionar método `updateUser` no userRepository**

```javascript
updateUser: (id, data) => {
    const users = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) return { error: 'Usuário não encontrado' };
    users[idx] = { ...users[idx], ...data };
    fs.writeFileSync(DB_PATH, JSON.stringify(users, null, 2));
    return { user: users[idx] };
}
```

- [ ] **Step 3: Adicionar `updateProfile` no authController**

```javascript
updateProfile(req, res) {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ message: 'Não autenticado' });

    const { nome, cpf, nascimento, telefone, email } = req.body;
    if (!nome || !cpf || !nascimento || !telefone || !email) {
        return res.status(400).json({ message: 'Preencha todos os campos' });
    }

    const result = userRepository.updateUser(userId, { nome, cpf, nascimento, telefone, email });
    if (result.error) return res.status(400).json({ message: result.error });

    req.session.userName = nome; // atualizar sessão
    res.json({ message: 'Perfil atualizado', user: result.user });
}
```

- [ ] **Step 4: Adicionar rota PUT `/profile` em authRoutes.js**

```javascript
authRoutes.put('/profile', authController.updateProfile);
```

- [ ] **Step 1: Adicionar `getProfile` no authController**

```javascript
getProfile(req, res) {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ message: 'Não autenticado' });
    const user = userRepository.findById(userId);
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });
    res.json({ id: user.id, nome: user.nome, email: user.email, cpf: user.cpf, nascimento: user.nascimento, telefone: user.telefone });
}
```

- [ ] **Step 2: Adicionar rota GET `/profile` em authRoutes.js**

```javascript
authRoutes.get('/profile', authController.getProfile);
```

- [ ] **Step 3: Commit**

```bash
git add src/controllers/authController.js src/routes/authRoutes.js
git commit -m "feat(perfil): backend para edição de perfil do usuário"
```

---

### Task 1b: Página de Perfil — perfil.html + perfil.js

**Files:**
- Create: `public/views/perfil.html`
- Create: `public/js/perfil.js`
- Modify: `src/app.js` — adicionar `app.get('/perfil', requireAuthPage, ...)`

- [ ] **Step 1: Criar perfil.html**

Estrutura: navbar (existente via `navbar.js`), título "Meu Perfil", formulário com campos (nome, cpf, nascimento, telefone, email), botão salvar, link voltar. Campos pré-preenchidos via API.

- [ ] **Step 2: Criar perfil.js**

Ao carregar: `GET /api/auth/me` para saber quem é → guardar userId.
 затем `GET /api/auth/profile` (criar endpoint em authController) ou usar os dados do `/me` + load completo do usuário.
Ao salvar: `PUT /api/auth/profile` com os dados do formulário.
Feedback: alert de sucesso/erro.

- [ ] **Step 3: Adicionar rota GET /perfil em app.js**

```javascript
app.get('/perfil', requireAuthPage, (req, res) =>
    res.sendFile(path.join(__dirname, '../public/views/perfil.html'))
);
```

- [ ] **Step 4: Commit**

```bash
git add public/views/perfil.html public/js/perfil.js src/app.js
git commit -m "feat(perfil): página de edição de perfil"
```

---

### Task 3: Formulário de Relato — atualizar relatar.html + relatar.js

**Files:**
- Modify: `public/views/relatar.html`
- Modify: `public/js/relatar.js`
- Modify: `src/database/reports.json` (schema)

- [ ] **Step 1: Atualizar relatar.html**

Remover campos: nome, cpf, nascimento, telefone, email.
Manter/adicionar: categoria, tipo (NOVO), endereço, descrição, foto.
Adicionar mensagem no topo do formulário:
```html
<div class="bg-primary-50 border border-primary-200 rounded-xl p-4 mb-6 text-sm">
  <span class="text-primary-700">ℹ️</span>
  Seus dados pessoais serão preenchidos automaticamente a partir do seu perfil.
  <a href="/perfil" class="font-semibold underline">Verificar/editá-los →</a>
</div>
```

Adicionar campo tipo depois da categoria:
```html
<div class="form-control md:col-span-2">
  <label class="label" for="tipo">
    <span class="label-text font-semibold">Tipo do Problema</span>
  </label>
  <select id="tipo" class="select select-bordered w-full">
    <option value="">Selecione primeiro a categoria</option>
  </select>
</div>
```

- [ ] **Step 2: Atualizar relatar.js**

1. No `DOMContentLoaded`: buscar `GET /api/auth/me` e guardar dados do usuário.
2. Mapear categorias → tipos (objeto JavaScript com todos os tipos por categoria).
3. No change da categoria: repopular o select de tipo com os tipos daquela categoria.
4. No submit: incluir `userId` (de `/me`), `tipo`, `dataHora` (ISO completo), `protocolo` (gerado no backend).

- [ ] **Step 3: Atualizar reportRepository.createReport**

Modificar para receber `userId, tipo, dataHora` e salvar com timestamp completo. Gerar protocolo como `RC-${id}-${timestamp}`.

- [ ] **Step 4: Atualizar sucesso do envio em relatar.js**

Modal de sucesso com dois botões:
- "Fechar" — fecha modal e reseta formulário
- "Ver meus relatos" — `window.location.href = '/meus-relatos'`

- [ ] **Step 5: Commit**

```bash
git add public/views/relatar.html public/js/relatar.js src/repositories/reportRepository.js src/controllers/reportController.js
git commit -m "feat(relatar): auto-preenchimento + tipo do problema + modal sucesso"
```

---

### Task 4: Meus Relatos — botão fixo topo + modal expandido + overflow

**Files:**
- Modify: `public/views/meus-relatos.html`
- Modify: `public/js/meus-relatos.js`

- [ ] **Step 1: Adicionar botão fixo no topo em meus-relatos.html**

Na barra de filtros (`.flex.flex-wrap.items-center.justify-between`), adicionar:
```html
<a href="/relatar" class="btn btn-sm bg-primary-500 hover:bg-primary-600 text-white border-none gap-2 rounded-xl normal-case font-semibold shadow-sm">
  <i data-lucide="plus" class="w-4 h-4"></i>
  Novo Relato
</a>
```

- [ ] **Step 2: Corrigir overflow do título do card em meus-relatos.js**

No `renderCard`, o título deve usar:
```javascript
<h3 class="font-semibold text-base-content mt-0.5" style="
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
">${report.endereco}</h3>
```

E o card em si deve ter `overflow: hidden` via CSS.

- [ ] **Step 3: Adicionar click no card abre modal expandido em meus-relatos.js**

No `renderCard`, adicionar `onclick` no card:
```javascript
<div class="card ... cursor-pointer hover:shadow-md transition-shadow" onclick="openReportModal(${report.id})">
```

Criar função `openReportModal(reportId)`:
1. Encontrar o relato em `allReports` pelo id
2. Montar HTML do modal com todos os campos (dados pessoais + dados do relato)
3. Mostrar modal com backdrop
4. Botão fechar fecha modal

- [ ] **Step 4: Commit**

```bash
git add public/views/meus-relatos.html public/js/meus-relatos.js
git commit -m "feat(meus-relatos): botão fixo topo + modal expandido + overflow"
```

---

### Task 5: Atualizar navbar.js — adicionar link "Meu Perfil"

**Files:**
- Modify: `public/js/navbar.js`

- [ ] **Step 1: No menu dropdown do usuário logado (desktop), adicionar "Meu Perfil"**

No menu dentro do `dropdown-content` do desktop, antes do "border-t":
```html
<li><a href="/perfil" class="rounded-lg text-sm gap-2">
  <i data-lucide="user" class="w-4 h-4"></i> Meu Perfil
</a></li>
```

- [ ] **Step 2: Commit**

```bash
git add public/js/navbar.js
git commit -m "feat(navbar): link para Meu Perfil no dropdown"
```

---

## Nota sobre o Banco de Dados

O `reports.json` atual não tem campo `tipo`. Relatos antigos não terão esse campo — ao exibir, mostrar "—" quando vazio. O campo `criadoEm` já existe como ISO string.

## Validação do Tipo

O select de tipo é populado via JavaScript no frontend, baseado na categoria selecionada. Não há validação no backend — o frontend sempre envia um tipo válido pois só mostra opções válidas.

---

## Ordem de Execução

1. Task 1 — Backend do perfil
2. Task 2 — Página de perfil
3. Task 3 — Formulário de relato
4. Task 4 — Meus Relatos
5. Task 5 — Navbar

Plan saved to `docs/superpowers/plans/2026-06-02-rf001-implementacao.md`.