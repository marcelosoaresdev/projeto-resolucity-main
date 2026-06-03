# RF-001 — Cadastro de Ocorrência: Design Completo

**Data:** 2026-06-02
**Autor:** Marcelo (via brainstorming)

---

## 1. Visão Geral

Melhorar o RF-001 (Cadastro de Ocorrência) para que o sistema use os dados do perfil do usuário logado no preenchimento automático, evitando repetição de informação. Adicionar controle de overflow nos cards, modal expandido na lista de relatos, e melhorar a experiência pós-envio.

---

## 2. Perfil do Usuário — `/perfil`

### Rota
- `GET /perfil` — página de edição do perfil (requer auth)
- `PUT /perfil` — endpoint para atualizar dados

### Campos editáveis
| Campo | Tipo | Validação |
|-------|------|-----------|
| Nome completo | text | mínimo 3 caracteres |
| CPF | text | checksum válido |
| Data de nascimento | date | 18+ anos |
| Telefone | text | formato brasileiro |
| Email | email | formato válido, único |

### Comportamento
- Campos pré-preenchidos com dados atuais do usuário
- Botão "Salvar" — atualiza no users.json
- Feedback visual de sucesso/erro
- Link "Voltar" para página anterior

---

## 3. Formulário de Relato — `/relatar`

### Campos (removidos do antigo)
- ~~Nome completo~~ → vem do perfil
- ~~CPF~~ → vem do perfil
- ~~Data de nascimento~~ → vem do perfil
- ~~Telefone~~ → vem do perfil
- ~~Email~~ → vem do perfil

### Campos mantidos/adicionados

| Campo | Tipo | Observação |
|-------|------|------------|
| Tipo do Problema | select | **NOVO** — depende da categoria selecionada |
| Categoria | select | 16 categorias pré-definidas |
| Endereço | textarea | obrigatório, mínimo 10 caracteres |
| Descrição | textarea | obrigatório, mínimo 20 caracteres |
| Foto | file | opcional, max 5MB |

### Mensagem no topo
> ℹ️ Os seus dados pessoais (nome, CPF, nascimento, telefone, email) serão preenchidos automaticamente a partir do seu perfil. **Verifique se estão corretos antes de enviar.** [Editar perfil →]

O link "Editar perfil →" leva para `/perfil`.

### Tipo do Problema — lista por categoria

| Categoria | Tipos disponíveis |
|------------|-------------------|
| Acessibilidade | Rampa bloqueada, Piso irregular, Sem elevador |
| Ciclismo | Ciclofaixa danificada, Ausência de ciclofaixa |
| Comércio e Fiscalização | Calçada irregular, Propaganda irregular |
| Corrupção e Má Gestão | Denúncia anônima |
| Drenagem | Boca de lobo entupida, Alagamento |
| Educação | Escola sem manutenção |
| Habitação | Área de risco, Construção irregular |
| Infraestrutura | Buraco, Iluminação queimada, Calçada quebrada, Lombada, Placa indisível |
| Limpeza Urbana e Lixo | Lixo acumulado, Área contaminada |
| Meio Ambiente | Desmatamento, Poluição, Maus-tratos |
| Obras | Obra abandonada, Má sinalização |
| Redes Elétricas/Luz | Fiação exposta, Postes danificados |
| Saúde Pública | Acúmulo de insetos, Esgoto a céu aberto |
| Segurança | Furto, Vandalismo, Drogas |
| Transporte | Ponto de ônibus danificado, Placa de rua ausente |
| Outros | Outro problema |

### Timestamp
- Data E hora: salvos juntos (ex: `2026-06-02T14:30:00.000Z`)
- Protocolo: gerado como `RC-${id}-${timestamp}` (ex: RC-1-1751557800000)

---

## 4. Modal de Sucesso Pós-Envio

### Conteúdo
- Ícone de check
- Título: "Relato enviado com sucesso!"
- Mensagem: "Seu protocolo é **RC-1-1751557800000**. O relato está em análise."
- Dois botões:
  - **Fechar** — fecha o modal, limpa o formulário
  - **Ver meus relatos** — redireciona para `/meus-relatos`

---

## 5. Meus Relatos — `/meus-relatos`

### Botão "Novo Relato"
- Posição: fixo no topo da página, acima dos filtros
- Estilo: botão primário verde com ícone "+"
- Link: `/relatar`

### Cards de relato
- **Overflow do título:** texto com ellipsis (max 2 linhas), não vaza do card
- **Badge de status:** fica na mesma linha se possível, ou quebra sem vazamento
- **Click no card:** abre modal expandido com todos os dados

### Modal Expandido (ao clicar no card)

| Seção | Conteúdo |
|-------|----------|
| Status | Badge colorido + label + data/hora do envio |
| Dados pessoais | Nome, CPF, nascimento, telefone, email |
| Dados do relato | Categoria, tipo, endereço, descrição |
| Foto | Exibida se existir |

### Protocolo
- Exibido no topo do modal: "Protocolo: RC-1-1751557800000"

---

## 6. Arquivos afetados

### Backend
- `src/app.js` — nova rota `GET /perfil`
- `src/routes/authRoutes.js` — nova rota `PUT /perfil`
- `src/controllers/authController.js` — novo método `updateProfile`
- `src/repositories/userRepository.js` — novo método `updateUser`

### Frontend
- `public/views/perfil.html` — **NOVO**
- `public/views/relatar.html` — remover campos redundantes, adicionar tipo
- `public/views/meus-relatos.html` — botão fixo topo, modal expandido
- `public/js/perfil.js` — **NOVO**
- `public/js/relatar.js` — remover campos, integrar com perfil
- `public/js/meus-relatos.js` — modal expandido, overflow

---

## 7. Prioridade de implementação

1. Perfil (`/perfil`) — cria a base de dados do usuário
2. Formulário (`/relatar`) — remove campos redundantes, usa dados do perfil
3. Tipo do problema — adiciona campo select dinâmico
4. Modal de sucesso — dois botões
5. Meus relatos — botão fixo topo + modal expandido + overflow

---

## 8. Notas

- Todos os dados do perfil são editáveis pelo próprio usuário
- Email único: validar duplicado ao editar
- Campos do perfil (nome, cpf, nascimento, telefone, email) não aparecem mais no formulário de relato — são preenchidos automaticamente a partir do perfil logado
- Validação do tipo: depende da categoria selecionada (JavaScript lado cliente)