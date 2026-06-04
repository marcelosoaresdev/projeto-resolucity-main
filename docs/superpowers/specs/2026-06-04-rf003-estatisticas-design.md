# SPEC: RF-003 — Geração de Estatísticas

> **Data:** 2026-06-04
> **Autor:** brainstorming superpowers + aprovação do usuário
> **Versão:** 1.0
> **Status:** Aprovada pelo usuário

---

## 1. Visão Geral

Página `/estatisticas` reformulada com 6 gráficos + KPI cards + filtro por período + polling automático 30s. Dados reais do banco `reports.json`. ApexCharts para visualizações modernas e profissionais.

---

## 2. Requisitos Funcionais Cobertos

| ID | Requisito | Como é coberto |
|----|-----------|----------------|
| RF-003 | Gráfico por tipo (categoria) | Gráfico 3 + Gráfico 5 |
| RF-003 | Ocorrências por região (bairro) | Gráfico 4 — extração de bairro do endereço |
| RF-003 | Filtrar por período | Filtro com 4 opções: 7d, 30d, Este Ano, Personalizado |
| RF-003 | Quantidade total de ocorrências | KPI Card Total + Gráfico Donut |
| RF-003 | Dados atualizados automaticamente | Polling a cada 30 segundos via fetch |

---

## 3. Layout

```
┌──────────────────────────────────────────────────────────────┐
│  [7 dias] [30 dias] [Este Ano] [Personalizado: __ a __]  ↻  │
├──────────────────────────────────────────────────────────────┤
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌───────────────┐      │
│  │ TOTAL   │ │PENDENTE │ │ANDAMENTO│ │   RESOLVIDOS  │      │
│  │  892    │ │   358   │ │   358   │ │     534       │      │
│  └─────────┘ └─────────┘ └─────────┘ └───────────────┘      │
├──────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────┐ ┌──────────────────────────┐  │
│  │  EVOLUÇÃO MENSAL         │ │  POR STATUS (Donut)       │  │
│  │  (area/line 12 meses)     │ │  Pendente/And/Resolvido   │  │
│  └──────────────────────────┘ └──────────────────────────┘  │
│  ┌──────────────────────────┐ ┌──────────────────────────┐  │
│  │  POR CATEGORIA            │ │  POR BAIRRE              │  │
│  │  (barras horizontais)      │ │  (barras horizontais)    │  │
│  └──────────────────────────┘ └──────────────────────────┘  │
│  ┌──────────────────────────┐ ┌──────────────────────────┐  │
│  │  RESOLVIDOS POR CATEGORIA │ │  EVOLUÇÃO RESOLVIDOS    │  │
│  │  (barras horizontais)     │ │  (line 12 meses)         │  │
│  └──────────────────────────┘ └──────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

- Grid desktop: 2 colunas (`grid-cols-2`)
- Grid mobile: 1 coluna (stack vertical)
- KPI cards: 2x2 no mobile

---

## 4. Filtro de Período

### 4.1 Opções

| Opção | Comportamento |
|-------|---------------|
| **7 dias** | `criadoEm >= (agora - 7 dias)` |
| **30 dias** | `criadoEm >= (agora - 30 dias)` |
| **Este Ano** | `criadoEm >= 01/01/ano atual` |
| **Personalizado** | Date picker início + fim + botão "Aplicar" |

### 4.2 Date Picker

- `<input type="date">` nativo do browser
- Data início não pode ser maior que data fim
- Botão "Aplicar" confirma filtro customizado
- Validação inline com mensagem de erro

### 4.3 Comportamento

- Ao filtrar, todos os 6 gráficos e KPI cards se atualizam juntos
- URL não muda (filtro em memória via JS)
- Se filtro for igual ao anterior, não refaz request

---

## 5. KPI Cards (4 cards)

| Card | Dado | Ícone | Cor |
|------|------|-------|-----|
| Total | `stats.total` | `file-text` | primary |
| Pendentes | `stats.pendentes` | `clock` | warning/laranja |
| Em Andamento | `stats.emAndamento` | `refresh-cw` | info/azul |
| Resolvidos | `stats.resolvidos` | `check-circle` | success/verde |

---

## 6. Gráficos (6 total)

### 6.1 Gráfico 1 — Evolução Mensal (area)

- **Tipo:** `area`
- **X-axis:** meses dos últimos 12 meses (Jun/2025 → Jun/2026)
- **Y-axis:** quantidade de relatos criados naquele mês
- **Objetivo:** mostrar se volume está crescendo ou diminuindo

### 6.2 Gráfico 2 — Por Status (donut)

- **Tipo:** `donut`
- **3 fatias:** Pendente, Em Andamento, Resolvido
- **Centro:** mostra total geral
- **Cores:** laranja (#f59e0b), azul (#3b82f6), verde (#22c55e)

### 6.3 Gráfico 3 — Por Categoria (bar horizontal)

- **Tipo:** `bar` (horizontal)
- **Dados:** `porCategoria`
- **Ordenação:** do maior para o menor
- **Contagem:** todos os status

### 6.4 Gráfico 4 — Por Bairro (bar horizontal)

- **Tipo:** `bar` (horizontal)
- **Dados:** `porBairro`
- **Máximo:** 10 bairros mais frequentes (top 10)
- **Fallback:** se bairro não identificável, agrupar como "Outros"

### 6.5 Gráfico 5 — Resolvidos por Categoria (bar)

- **Tipo:** `bar` (horizontal)
- **Dados:** `resolvidosPorCategoria`
- **Mesma ordenação do Gráfico 3**

### 6.6 Gráfico 6 — Evolução de Resolvidos (line)

- **Tipo:** `line`
- **X-axis:** mesmos 12 meses do Gráfico 1
- **Y-axis:** quantos foram resolvidos em cada mês (não quantos criados)

---

## 7. Extração de Bairro

O campo `endereco` tem formato livre como:
`"Rua das Flores, 123 - Centro, Volta Redonda - RJ"`

### 7.1 Lógica de Extração

```
1. Encontrar padrão: ", {bairro}, {cidade}"
2. Extrair texto entre última vírgula e primeiro " - "
3. Se não conseguir extrair → agrupar como "Outros"
```

### 7.2 Agrupamento

- Prioridade: bairro identificado > "Outros"
- Cidade é sempre "Volta Redonda" (hardcoded como default)
- Se não houver endereço com bairro, todos caem em "Outros"

---

## 8. API

### 8.1 Endpoints

```
GET /api/stats
GET /api/stats?period=7d
GET /api/stats?period=30d
GET /api/stats?period=ano
GET /api/stats?period=custom&start=2026-01-01&end=2026-06-01
```

### 8.2 Query Params

| Param | Descrição |
|-------|-----------|
| `period` | `7d`, `30d`, `ano`, `custom` |
| `start` | Data início (para period=custom), formato `YYYY-MM-DD` |
| `end` | Data fim (para period=custom), formato `YYYY-MM-DD` |

### 8.3 Resposta

```json
{
  "total": 892,
  "pendentes": 358,
  "emAndamento": 0,
  "resolvidos": 534,
  "porCategoria": { "Iluminação": 45, "Buraco": 120 },
  "resolvidosPorCategoria": { "Iluminação": 30, "Buraco": 80 },
  "porBairro": { "Centro": 89, "Aterrado": 67 },
  "porMes": {
    "2025-06": 34, "2025-07": 45, "2025-08": 52
  },
  "resolvidosPorMes": {
    "2025-06": 20, "2025-07": 31, "2025-08": 40
  }
}
```

---

## 9. Polling

```javascript
setInterval(async () => {
  const res = await fetch('/api/stats?period=' + currentPeriod);
  const stats = await res.json();
  updateAllCharts(stats);
}, 30000);
```

- Atualiza dados a cada 30 segundos
- Não recarrega página
- Animação suave ApexCharts ao atualizar
- Se filtro atual for "custom", enviar também start/end

---

## 10. Estados Especiais

| Situação | Comportamento |
|----------|---------------|
| Nenhum relato no período | Mostrar "Sem dados para o período" nos gráficos (ApexCharts `annotations.text`) |
| Bairro não identificável | Agrupar como "Outros" |
| Período futuro (date picker) | Mostrar "Sem dados" |
| API fora do ar | Toast/aviso discreto "Não foi possível carregar estatísticas" |

---

## 11. Cores dos Gráficos

```
Pendente:       #f59e0b (laranja)
Em Andamento:   #3b82f6 (azul)
Resolvido:      #22c55e (verde)

Categorias/Bairros: paleta ApexCharts padrão (hsla automático)
```

---

## 12. Responsivo Mobile

- Grid: `grid-cols-1` no mobile, `grid-cols-2` no desktop (`lg:` breakpoint)
- KPI cards: 2x2 no mobile
- Gráficos de barra horizontal: altura dinâmica baseada no número de itens
- Date picker: full width no mobile

---

## 13. Acessibilidade

- Cards KPI: `aria-label="Total de relatos: 892"`
- Botões de filtro: `aria-pressed="true/false"`
- Gráficos: `aria-label` descrevendo tipo de dado
- Date picker: labels associados corretamente

---

## 14. Responsabilidades por Arquivo

| Arquivo | O que muda |
|---------|-----------|
| `src/repositories/reportRepository.js` | `getStats()` aceita filtros de período, retorna `porBairro`, `porMes`, `resolvidosPorMes` |
| `src/controllers/reportController.js` | `getStats()` repassa query params para o repository |
| `public/js/chart.js` | **REESCRITO** com ApexCharts — 6 gráficos, filtro período, polling |
| `public/views/estatisticas.html` | Atualizado com estrutura de cards + filtro período + container para 6 charts |
| `public/css/global.css` | Estilos para cards, filtro período, responsivo |

---

## 15. Dependência Nova

```html
<script src="https://cdn.jsdelivr.net/npm/apexcharts"></script>
```

---

## 16. Critérios de Aceitação

- [ ] 4 KPI cards mostram total, pendentes, em andamento, resolvidos
- [ ] Gráfico de evolução mensal (area) com 12 meses
- [ ] Gráfico donut com 3 fatias de status
- [ ] Gráfico barras horizontais por categoria (total)
- [ ] Gráfico barras horizontais por bairro (top 10)
- [ ] Gráfico barras horizontais por categoria (resolvidos)
- [ ] Gráfico linha com evolução de resolvidos por mês
- [ ] Filtro 7 dias filtra dados corretamente
- [ ] Filtro 30 dias filtra dados corretamente
- [ ] Filtro "Este Ano" filtra dados corretamente
- [ ] Filtro customizado com date picker funciona
- [ ] Polling atualiza dados a cada 30s
- [ ] Página funciona no mobile (responsivo)
- [ ] Sem dados para período mostra mensagem amigável
- [ ] API retorna todos os campos novos (porBairro, porMes, etc.)

---

## 17. Out of Scope (para depois)

- Exportar relatórios em PDF/Excel
- Comparação de períodos (mês X mês anterior)
- Filtro por categoria dentro do gráfico
- Drill-down ao clicar no bairro para ver relatos específicos
- Mapa de calor por região
- Notificação push de novos relatos

---

_Spec gerada via brainstorming superpowers + aprovação do usuário._
