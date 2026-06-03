# RF-002 — Mapa: Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar o mapa interativo com coordenadas reais via pin manual, popup completo, filtros combinados, clustering e polling automático.

**Architecture:** Backend Express com repositórios JSON. Frontend vanilla JS com Leaflet + OpenStreetMap. Pin manual no formulário de relato com reverse geocoding via Nominatim. Leaflet.markercluster para agrupar marcadores próximos.

**Tech Stack:** Node.js, Express, JSON file storage, Leaflet, Leaflet.markercluster, Nominatim API, vanilla JS, DaisyUI/Tailwind

---

## Visão Geral dos Arquivos

| Arquivo | Ação | Responsabilidade |
|---------|------|-----------------|
| `src/repositories/reportRepository.js` | Modify | Ajustar `createReport` para receber `latitude`, `longitude`, `endereco`. Retornar `latitude`, `longitude` no `listReports`. |
| `src/controllers/reportController.js` | Modify | Repassar `latitude`, `longitude`, `endereco` no body para o repository |
| `public/js/geolocation.js` | Create | Funções compartilhadas: createMap, createPinIcon, reverseGeocode, STATUS_CONFIG, CENTER (Volta Redonda) |
| `public/js/mapa.js` | Modify | Clustering, polling 30s, filtros combinados, popup completo, renderMarkers refatorado |
| `public/js/relatar.js` | Modify | Mapa inline com pin, reverse geocoding, auto-preenchimento do endereço |
| `public/views/mapa.html` | Modify | Dropdown categoria na barra de filtros, CDN do markercluster |
| `public/views/relatar.html` | Modify | Container do mapa inline, ajusta campo endereço para textarea → input text |
| `src/database/reports.json` | Modify | Adicionar `latitude`, `longitude`, `tipo` nos relatos existentes (null para dados antigos) |

---

## Tarefas

### Task 1: Backend — latitude, longitude, endereco

**Files:**
- Modify: `src/repositories/reportRepository.js:7-24`
- Modify: `src/controllers/reportController.js:4-9`

- [ ] **Step 1: Atualizar `createReport` no reportRepository**

Modificar a assinatura para receber `latitude` e `longitude`:

```javascript
createReport: (userId, categoria, tipo, endereco, descricao, latitude, longitude) => {
    const reports = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    const timestamp = new Date().toISOString();
    const newReport = {
        id: reports.length + 1,
        userId,
        categoria,
        tipo,
        endereco,
        descricao,
        status: 'pendente',
        protocolo: `RC-${reports.length + 1}-${Date.now()}`,
        criadoEm: timestamp,
        latitude,   // pode ser null
        longitude   // pode ser null
    };
    reports.push(newReport);
    fs.writeFileSync(DB_PATH, JSON.stringify(reports, null, 2));
    return { newReport, message: 'Relato criado com sucesso!' };
},
```

- [ ] **Step 2: Atualizar `listReports` para incluir latitude/longitude**

O `listReports` já retorna o array inteiro do JSON — os novos campos estarão lá automaticamente. Nenhuma mudança necessária se o JSON já os tiver. Mas garantir que os campos existem em todas as entradas do array (ver Task 7 para migrate).

- [ ] **Step 3: Atualizar `createReport` no reportController**

```javascript
createReport(req, res) {
    const { categoria, tipo, endereco, descricao, latitude, longitude } = req.body;
    const userId = req.session.userId;
    const result = reportRepository.createReport(
        userId, categoria, tipo, endereco, descricao, latitude, longitude
    );
    res.status(201).json(result);
},
```

- [ ] **Step 4: Commit**

```bash
git add src/repositories/reportRepository.js src/controllers/reportController.js
git commit -m "feat(mapa): backend com campos latitude/longitude/endereco no report"
```

---

### Task 2: Arquivo de geolocalização — geolocation.js

**Files:**
- Create: `public/js/geolocation.js`

- [ ] **Step 1: Criar geolocation.js**

```javascript
// Centro: Volta Redonda, RJ
export const CENTER = [-22.5207, -44.0883];

export const STATUS_CONFIG = {
    pendente:      { color: '#f59e0b', label: 'Pendente' },
    em_andamento:  { color: '#3b82f6', label: 'Em Andamento' },
    resolvido:     { color: '#22c55e', label: 'Resolvido' },
};

// Ícone personalizado por status
export function createIcon(status) {
    const { color } = STATUS_CONFIG[status] || STATUS_CONFIG.pendente;
    return L.divIcon({
        html: `<div style="
            background:${color};
            width:32px;height:32px;
            border-radius:50%;
            border:3px solid white;
            box-shadow:0 2px 6px rgba(0,0,0,0.3);
            display:flex;align-items:center;justify-content:center;
        ">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
        </div>`,
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
    });
}

// Reverse geocoding via Nominatim
export async function reverseGeocode(lat, lng) {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&accept-language=pt-BR`;
    try {
        const res = await fetch(url, {
            headers: { 'User-Agent': 'Resolucity/1.0 (projeto-resolucity@example.com)' }
        });
        if (!res.ok) throw new Error('Nominatim error');
        const data = await res.json();
        return formatAddress(data.address);
    } catch (err) {
        console.warn('Reverse geocoding falhou:', err);
        return null;
    }
}

// Formatar endereço do Nominatim para formato brasileiro
function formatAddress(address) {
    if (!address) return '';
    const parts = [];
    if (address.road) parts.push(address.road);
    if (address.house_number) parts.push(address.house_number);
    if (address.neighbourhood || address.suburb) parts.push(address.neighbourhood || address.suburb);
    if (address.city || address.municipality) parts.push(address.city || address.municipality);
    if (address.state) parts.push(address.state);
    return parts.join(', ');
}

// Formatar data para pt-BR com hora
export function formatDateTime(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR') + ' às ' +
        d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}
```

- [ ] **Step 2: Commit**

```bash
git add public/js/geolocation.js
git commit -m "feat(mapa): geolocation.js com utilitários de mapa e Nominatim"
```

---

### Task 3: Mapa inline no formulário de relato

**Files:**
- Modify: `public/views/relatar.html:178-185`
- Modify: `public/js/relatar.js`

- [ ] **Step 1: Substituir textarea de endereço por input text em relatar.html**

```html
<!-- Antes -->
<textarea id="endereco" rows="3" placeholder="Rua, número, bairro, município..." class="textarea textarea-bordered w-full resize-none"></textarea>

<!-- Depois -->
<input type="text" id="endereco" placeholder="Clique no mapa abaixo para selecionar o endereço..." class="input input-bordered w-full" readonly>
```

- [ ] **Step 2: Adicionar container do mapa inline em relatar.html**

Depois do campo endereço (linha ~185), adicionar:

```html
<!-- Mapa Inline para seleção de localização -->
<div class="form-control md:col-span-2" id="map-container" style="display:none">
    <label class="label">
        <span class="label-text font-semibold">Localização no Mapa</span>
        <span class="label-text-alt text-base-content/50">Clique para posicionar o pino</span>
    </label>
    <div id="relatar-map" style="height:250px;border-radius:12px;border:1px solid #d1d5db"></div>
    <span id="enderecoStatus" class="text-xs mt-1" style="color:#666;display:none">
        <i data-lucide="loader-2" class="w-3 h-3 inline animate-spin"></i> Buscando endereço...
    </span>
</div>

<!-- Botão para mostrar mapa (para usuário editar localização) -->
<div class="md:col-span-2">
    <button type="button" id="btn-show-map" class="btn btn-outline btn-sm gap-2 w-full">
        <i data-lucide="map-pin" class="w-4 h-4"></i>
        Selecionar localização no mapa
    </button>
</div>
```

- [ ] **Step 3: Importar Leaflet e markercluster CSS em relatar.html**

No `<head>`, adicionar antes do CSS global:

```html
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
```

- [ ] **Step 4: Importar Leaflet JS em relatar.html**

No fim do `<body>` antes dos outros scripts:

```html
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script src="../js/geolocation.js" type="module"></script>
```

- [ ] **Step 5: Atualizar relatar.js com lógica do mapa inline**

No `FormValidator.init()` (após o código de categoria change), adicionar:

```javascript
// Mapa inline para seleção de localização
const mapContainer = document.getElementById('map-container');
const btnShowMap = document.getElementById('btn-show-map');
const enderecoInput = document.getElementById('endereco');
const enderecoStatus = document.getElementById('enderecoStatus');

let mapInstance = null;
let pinMarker = null;

async function showMap() {
    mapContainer.style.display = 'block';
    btnShowMap.style.display = 'none';
    enderecoInput.removeAttribute('readonly');
    enderecoInput.placeholder = 'Clique no mapa para selecionar...';
    enderecoInput.value = '';
    enderecoInput.focus();

    if (mapInstance) return;

    mapInstance = L.map('relatar-map').setView(CENTER, 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19,
    }).addTo(mapInstance);

    // Pin inicial arrastável
    pinMarker = L.marker(CENTER, {
        draggable: true,
        icon: createIcon('pendente')
    }).addTo(mapInstance);

    // Ao clicar no mapa, mover o pin
    mapInstance.on('click', async (e) => {
        pinMarker.setLatLng(e.latlng);
        await fetchAddress(e.latlng.lat, e.latlng.lng);
    });

    // Ao arrastar o pin
    pinMarker.on('dragend', async () => {
        const pos = pinMarker.getLatLng();
        await fetchAddress(pos.lat, pos.lng);
    });

    // Forçar resize do mapa após显示
    setTimeout(() => mapInstance.invalidateSize(), 200);
}

async function fetchAddress(lat, lng) {
    enderecoStatus.style.display = 'block';
    const addr = await reverseGeocode(lat, lng);
    if (addr) {
        enderecoInput.value = addr;
        enderecoStatus.style.display = 'none';
    } else {
        enderecoInput.placeholder = 'Endereço não encontrado. Digite manualmente.';
        enderecoInput.readOnly = false;
        enderecoStatus.style.display = 'none';
    }
}

btnShowMap.addEventListener('click', showMap);
```

- [ ] **Step 6: Guardar lat/lng no submit**

No `handleSubmit` de relatar.js, adicionar `latitude` e `longitude` no body:

```javascript
async handleSubmit(e) {
    e.preventDefault();
    if (!this.validateAll()) return;

    const body = {
        categoria: this.fields.categoria.element.value,
        tipo: this.fields.tipo.element.value,
        endereco: this.fields.endereco.element.value.trim(),
        descricao: this.fields.message.element.value.trim(),
        latitude: pinMarker ? pinMarker.getLatLng().lat : null,
        longitude: pinMarker ? pinMarker.getLatLng().lng : null
    };
    // ... resto igual
}
```

- [ ] **Step 7: Commit**

```bash
git add public/views/relatar.html public/js/relatar.js
git commit -m "feat(relatar): mapa inline com pin e reverse geocoding"
```

---

### Task 4: Página do Mapa — popup completo + filtros combinados + polling + clustering

**Files:**
- Modify: `public/views/mapa.html`
- Modify: `public/js/mapa.js`

- [ ] **Step 1: Adicionar CSS do markercluster + dropdown de categoria no mapa.html**

No `<head>` antes do `global.css`:

```html
<link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.css" />
<link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.Default.css" />
```

No fim do `<body>` antes dos scripts:

```html
<script src="https://unpkg.com/leaflet.markercluster@1.4.1/dist/leaflet.markercluster.js"></script>
```

- [ ] **Step 2: Adicionar dropdown de categoria na barra de filtros em mapa.html**

Substituir a seção de filtros (linhas ~95-113) por:

```html
<section class="pb-4">
    <div class="max-w-[1184px] mx-auto px-6 lg:px-10">
        <div class="flex flex-wrap gap-2 mb-4">
            <!-- Dropdown Categoria -->
            <select id="filter-categoria" class="select select-sm select-bordered rounded-xl text-sm">
                <option value="">Todas as categorias</option>
                <option>Acessibilidade</option>
                <option>Ciclismo</option>
                <option>Comércio e Fiscalização</option>
                <option>Corrupção e Má Gestão</option>
                <option>Drenagem</option>
                <option>Educação</option>
                <option>Habitação</option>
                <option>Infraestrutura</option>
                <option>Limpeza Urbana e Lixo</option>
                <option>Meio Ambiente</option>
                <option>Obras</option>
                <option>Redes Elétricas/Luz</option>
                <option>Saúde Pública</option>
                <option>Segurança</option>
                <option>Transporte</option>
                <option>Outros</option>
            </select>

            <!-- Botões Status -->
            <button data-filter="todos" class="btn btn-sm btn-primary rounded-xl">
                Todos <span class="badge badge-sm bg-white/20 text-white border-none ml-1" id="count-todos">0</span>
            </button>
            <button data-filter="pendente" class="btn btn-sm btn-outline btn-primary rounded-xl">
                Pendente <span class="badge badge-sm badge-warning ml-1" id="count-pendente">0</span>
            </button>
            <button data-filter="em_andamento" class="btn btn-sm btn-outline btn-primary rounded-xl">
                Em Andamento <span class="badge badge-sm badge-info ml-1" id="count-andamento">0</span>
            </button>
            <button data-filter="resolvido" class="btn btn-sm btn-outline btn-primary rounded-xl">
                Resolvido <span class="badge badge-sm badge-success ml-1" id="count-resolvido">0</span>
            </button>
        </div>
    </div>
</section>
```

- [ ] **Step 3: Atualizar CSS do cluster para combinar com o tema**

Adicionar no `<style>` do mapa.html:

```html
<style>
    .marker-cluster-small,
    .marker-cluster-medium,
    .marker-cluster-large {
        background-color: rgba(20, 107, 67, 0.3) !important;
    }
    .marker-cluster-small div,
    .marker-cluster-medium div,
    .marker-cluster-large div {
        background-color: #146C43 !important;
        color: white !important;
        font-weight: 600;
    }
    .leaflet-popup-content-wrapper {
        border-radius: 12px;
        padding: 0;
    }
    .leaflet-popup-content {
        margin: 16px;
    }
</style>
```

- [ ] **Step 4: Reescrever mapa.js completo com clustering, polling, filtros**

Substituir todo o conteúdo de `public/js/mapa.js` por:

```javascript
import { CENTER, STATUS_CONFIG, createIcon, formatDateTime } from './geolocation.js';

const map = L.map('map').setView(CENTER, 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap',
    maxZoom: 19,
}).addTo(map);

// Clustering
const markers = L.markerClusterGroup({
    chunkedLoading: true,
    maxClusterRadius: 50,
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: false,
});
map.addLayer(markers);

let allReports = [];
let currentCategoria = '';
let currentStatus = 'todos';

// Renderizar marcadores
function renderMarkers() {
    markers.clearLayers();

    const filtered = allReports.filter(r => {
        if (!r.latitude || !r.longitude) return false;
        if (currentStatus !== 'todos' && r.status !== currentStatus) return false;
        if (currentCategoria && r.categoria !== currentCategoria) return false;
        return true;
    });

    filtered.forEach(report => {
        const { color, label } = STATUS_CONFIG[report.status] || STATUS_CONFIG.pendente;
        const popupHtml = `
            <div style="min-width:220px">
                <h3 style="margin:0 0 6px;font-weight:600;font-size:14px;color:#146C43">
                    ${report.categoria}
                </h3>
                <p style="margin:0 0 4px;font-size:13px;color:#333">${report.endereco || ''}</p>
                ${report.nome ? `<p style="margin:0 0 4px;font-size:12px;color:#666">👤 ${report.nome}</p>` : ''}
                ${report.tipo ? `<p style="margin:0 0 4px;font-size:12px">📋 Tipo: ${report.tipo}</p>` : ''}
                <p style="margin:0 0 6px;font-size:12px">📅 ${formatDateTime(report.criadoEm)}</p>
                <div style="display:flex;align-items:center;gap:6px">
                    <span style="background:${color};color:white;padding:2px 10px;border-radius:12px;font-size:11px;font-weight:500">${label}</span>
                </div>
            </div>
        `;

        const marker = L.marker([report.latitude, report.longitude], {
            icon: createIcon(report.status)
        }).bindPopup(popupHtml);

        markers.addLayer(marker);
    });
}

// Atualizar contadores
function updateCounts() {
    const withCoords = allReports.filter(r => r.latitude && r.longitude);
    document.getElementById('count-todos').textContent = withCoords.length;
    document.getElementById('count-pendente').textContent = withCoords.filter(r => r.status === 'pendente').length;
    document.getElementById('count-andamento').textContent = withCoords.filter(r => r.status === 'em_andamento').length;
    document.getElementById('count-resolvido').textContent = withCoords.filter(r => r.status === 'resolvido').length;
}

// Carregar relatórios
async function loadReports() {
    try {
        const res = await fetch('/api/reports');
        const newReports = await res.json();

        // Verificar se há novos relatórios (por ID)
        const existingIds = new Set(allReports.map(r => r.id));
        const hasNew = newReports.some(r => !existingIds.has(r.id));

        allReports = newReports;
        updateCounts();
        renderMarkers();

        // Mostrar/esconder mensagem de vazio
        const withCoords = allReports.filter(r => r.latitude && r.longitude);
        const msg = document.getElementById('no-reports-msg');
        if (withCoords.length === 0) {
            msg.classList.remove('hidden');
        } else {
            msg.classList.add('hidden');
        }
    } catch (err) {
        console.error('Erro ao carregar relatórios:', err);
    }
}

// Filtro por status
document.querySelectorAll('[data-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('[data-filter]').forEach(b => {
            if (b.dataset.filter !== 'todos') b.classList.add('btn-outline');
        });
        if (btn.dataset.filter !== 'todos') {
            btn.classList.remove('btn-outline');
        }
        currentStatus = btn.dataset.filter;
        renderMarkers();
    });
});

// Filtro por categoria
document.getElementById('filter-categoria').addEventListener('change', (e) => {
    currentCategoria = e.target.value;
    renderMarkers();
});

// Polling: atualizar a cada 30s
setInterval(loadReports, 30000);

// Iniciar
document.addEventListener('DOMContentLoaded', loadReports);
```

- [ ] **Step 5: Commit**

```bash
git add public/views/mapa.html public/js/mapa.js
git commit -m "feat(mapa): popup completo + filtros combinados + clustering + polling"
```

---

### Task 5: Atualizar navbar.js — adicionar link mapa para usuários logados

Este item já foi implementado no RF-001 (navbar já tem link `/mapa`). Verificar se existe e ajustar se necessário.

**Files:**
- Modify: `public/js/navbar.js` (se precisar)

---

### Task 6: Atualizar reports.json — adicionar campos nos relatos existentes

**Files:**
- Modify: `src/database/reports.json`

- [ ] **Step 1: Migrar reports.json**

Atualizar cada relato para adicionar `latitude: null`, `longitude: null` e `tipo: null` (para relatos antigos que não têm esses campos):

```javascript
// Para cada relato existente, adicionar se não existirem:
{
  ...report,
  tipo: report.tipo || null,
  latitude: report.latitude || null,
  longitude: report.longitude || null
}
```

Nota: isso é feito manualmente no arquivo JSON ou via script. Os relatos existentes não têm coordenadas então não aparecerão no mapa — está correto.

---

### Task 7: Atualizar lista de categorias na navbar do mapa

Verificar se a navbar do mapa.html (linhas 57-62) inclui o link `/mapa` — já deve estar incluso. Se não estiver, adicionar.

---

## Validação do Fluxo

1. Criar relato com pin no mapa → latitude/longitude salvos no JSON → aparecem no mapa
2. Sem pin → latitude/longitude null → não aparecem no mapa (sem erro)
3. Popup clicável com todos os dados
4. Filtro categoria AND status funcionam juntos
5. Polling adiciona novos marcadores a cada 30s

---

## Ordens de Execução

1. **Task 1** — Backend (repository + controller)
2. **Task 2** — geolocation.js (utilitários)
3. **Task 3** — Mapa inline no relato
4. **Task 4** — Página do mapa completa
5. **Task 6** — Migrar reports.json

Plan saved to `docs/superpowers/plans/2026-06-02-rf002-mapa-implementacao.md`.