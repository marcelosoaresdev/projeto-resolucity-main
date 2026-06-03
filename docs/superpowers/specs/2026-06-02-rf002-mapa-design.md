# SPEC: RF-002 — Visualização em Mapa

> **Data:** 2026-06-02
> **Autor:** CAIO DA FONSECA AVELINO (original RF) + brainstorming superpowers
> **Versão:** 1.0
> **Status:** Aprovada pelo usuário

---

## 1. Visão Geral

A página `/mapa` exibe todas as ocorrências geolocalizadas em um mapa Leaflet com OpenStreetMap. Cada ocorrência é um marcador colorido por status. O usuário filtra por categoria E status simultaneamente, clica para ver popup completo, e o mapa atualiza automaticamente a cada 30 segundos com clustering para marcadores próximos.

Na página de relato (`/relatar`), o formulário ganha um mapa inline onde o usuário posiciona um pin para definir a localização. Ao posicionar, o endereço é preenchido automaticamente via Nominatim.

---

## 2. Requisitos Funcionais Cobertos

| ID | Requisito | Como é coberto |
|----|-----------|----------------|
| RF-002 | Exibir mapa interativo | Leaflet + OpenStreetMap |
| RF-002 | Ocorrências como marcadores | Marcadores coloridos por status |
| RF-002 | Popup com detalhes ao clicar | Popup completo com todos os dados |
| RF-002 | Filtros por tipo de ocorrência | Dropdown categoria + botões status (AND) |
| RF-002 | Mapa atualizado em tempo real | Polling 30s + clustering |

---

## 3. Modelo de Dados

### 3.1 Campos novos em `reports.json`

```json
{
  "latitude": -22.5207,       // number | null
  "longitude": -44.0883,      // number | null
  "endereco": "Rua das Flores, 123 - Centro, Volta Redonda - RJ",
  "tipo": "Buraco"            // string (já existente no novo schema)
}
```

### 3.2 Regras

- Ocorrências com `latitude` e `longitude` null **não são exibidas no mapa**
- `endereco` é gerado automaticamente pelo reverse geocoding do Nominatim baseado nas coordenadas do pin
- `tipo` é obrigatório quando categoria exige (mapeamento categoria → tipos)

---

## 4. Fluxo: Criação de Relato com Mapa Inline

```
Usuário abre /relatar (autenticado)
    ↓
Seleciona Categoria → Sistema popula dropdown de Tipo
    ↓
Preenche Título e Descrição
    ↓
Clica no mapa inline para posicionar pin
    ↓
Sistema调用 Nominatim reverse geocoding
    ↓
Sistema preenche campo "Endereço" automaticamente
    ↓
Usuário pode editar o endereço manualmente se necessário
    ↓
Envia formulário
    ↓
Sistema salva latitude, longitude, endereco no banco
```

### 4.1 Mapa Inline no Formulário

- **Dimensões:** 250px de altura, largura total do container
- **Posição:** abaixo do campo "Endereço" no formulário
- **Pin inicial:** centro de Volta Redonda `[-22.5207, -44.0883]`
- **Interação:** clique único posiciona o pin (arrastar o pin também é permitido)
- **Reverse geocoding:** após posicionar pin, GET para `https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lng}&format=json&addressdetails=1&accept-language=pt-BR`
- **Timeout:** 5 segundos; se falhar, manter campo editável manualmente
- **Feedback:** placeholder "Buscando endereço..." enquanto aguarda

### 4.2 API de Reverse Geocoding

```javascript
// geolocation.js
async function reverseGeocode(lat, lng) {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&accept-language=pt-BR`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Resolucity/1.0' } });
  const data = await res.json();
  // Retorna string formatada: "Rua X, Número - Bairro, Cidade - Estado"
  return formatAddress(data.address);
}
```

---

## 5. Fluxo: Página do Mapa (`/mapa`)

```
Usuário abre /mapa
    ↓
Sistema carrega todas as ocorrências com GET /api/reports
    ↓
Sistema filtra apenas ocorrências com latitude e longitude não-nulas
    ↓
Sistema exibe marcadores no mapa com clustering
    ↓
Usuário interage com filtros (categoria + status AND)
    ↓
Sistema atualiza marcadores visíveis em tempo real
    ↓
Polling a cada 30s busca novas ocorrências
```

### 5.1 Marcadores

| Status | Cor | Icone |
|--------|-----|-------|
| Pendente | Laranja `#f59e0b` | Ícone de marcação |
| Em Andamento | Azul `#3b82f6` | Ícone de marcação |
| Resolvido | Verde `#22c55e` | Ícone de marcação |

### 5.2 Clustering (Leaflet.markercluster)

- Marcadores a menos de 50px de distância são agrupados
- Cluster mostra contador em círculo azul
- Ao clicar no cluster, mapa dá zoom para expandir
- CSS customizado para combinar com o tema verde do projeto

### 5.3 Popup Completo

```
┌─────────────────────────────────────┐
│ [Ícone categoria] Categoria — Título│
│─────────────────────────────────────│
│ 👤 Nome do autor                    │
│ 📍 Endereço completo                │
│ 📋 Tipo: Buraco                    │
│ 📅 02/06/2026 às 14:35             │
│ 🟡 Status: Pendente                │
└─────────────────────────────────────┘
```

Se tiver foto, botão "Ver foto" abre em nova aba.

---

## 6. Filtros

### 6.1 Estrutura

```
[Dropdown: Todas as categorias ▼] [Todos 15] [Pendente 3] [Em Andamento 5] [Resolvido 7]
```

- **Dropdown categoria:** ordenado alfabeticamente, opção "Todas"
- **Botões status:** com badge de contagem, cor de fundo muda conforme filtro ativo
- **Lógica:** categoria AND status aplicados juntos
- **Default:** "Todas as categorias" + "Todos"
- **Contadores:** refletem o total de ocorrências com coordenadas (não o total geral)

### 6.2 Contadores

```
GET /api/reports → allReports
countTodos = allReports.filter(r => r.latitude != null).length
countPendente = allReports.filter(r => r.status === 'pendente' && r.latitude != null).length
countAndamento = allReports.filter(r => r.status === 'em_andamento' && r.latitude != null).length
countResolvido = allReports.filter(r => r.status === 'resolvido' && r.latitude != null).length
```

---

## 7. Polling de Atualização

```javascript
setInterval(async () => {
  const res = await fetch('/api/reports');
  const newReports = await res.json();
  // Comparar IDs novos com existing
  // Novos marcadores são adicionados ao mapa com animação
  // Removidos não são removidos (polling não remove, só adiciona)
}, 30000);
```

- Apenas adiciona marcadores novos (não remove)
- Contadores são recalculados após cada polling
- Não recarrega toda a camada de marcadores se não houver mudanças

---

## 8. Navegação e Link no Mapa

- Navbar já tem link `/mapa` para usuários logados e não-logados
- Filtros e mapa são acessíveis sem autenticação (princípio de transparência)

---

## 9. Responsabilidades por Arquivo

| Arquivo | Responsabilidade |
|---------|-----------------|
| `src/repositories/reportRepository.js` | Ajustar `createReport` para receber lat/lng/endereco. Ajustar `getAllReports` para retornar esses campos. |
| `src/controllers/reportController.js` | Repassar `latitude`, `longitude`, `endereco` no body para o repository |
| `public/js/geolocation.js` | **NOVO** — reverseGeocode, createMap, createPinIcon, STATUS_CONFIG |
| `public/js/mapa.js` | Clustering, polling, filtros combinados, popup completo, renderMarkers refatorado |
| `public/js/relatar.js` | Mapa inline, posicionamento do pin, reverse geocoding, auto-preenchimento do endereço |
| `public/views/mapa.html` | Estrutura de filtros com dropdown categoria, container do mapa |
| `public/views/relatar.html` | Mapa inline e campo endereço |
| `src/database/reports.json` | Atualizar dados de exemplo com lat/lng reais |

---

## 10. Dependências Externas

| Recurso |URL | Uso |
|---------|----|-----|
| Leaflet | unpkg.com/leaflet | Mapa base |
| Leaflet.markercluster | unpkg.com/leaflet.markercluster | Clustering |
| Nominatim | openstreetmap.org/nominatim | Reverse geocoding |

---

## 11. Critérios de Aceitação

- [ ] Ocorrência com coordenadas aparece como marcador colorido no mapa
- [ ] Ocorrência sem coordenadas não aparece no mapa (sem erro)
- [ ] Popup mostra: autor, categoria, tipo, endereço, data/hora completa, status
- [ ] Filtro de categoria AND status funcionam juntos
- [ ] Contadores refletem ocorrências com coordenadas
- [ ] Cluster agrupa marcadores próximos
- [ ] Popup de cluster expansiona ao clicar
- [ ] Polling adiciona novos marcadores a cada 30s
- [ ] Formulário de relato tem mapa inline
- [ ] Pin no mapa captura lat/lng
- [ ] Endereço é preenchido automaticamente após posicionar pin
- [ ] Endereço pode ser editado manualmente após preenchimento

---

## 12. Out of Scope (para depois)

- Geocodificação direta (endereço → lat/lng por digitação)
- Autocomplete de endereço
- Foto no popup
- Clustering customizado com Supercluster
- Filtro por data
- Geofencing (raio de proximidade)

---

_Spec gerada via brainstorming superpowers + aprovação do usuário._