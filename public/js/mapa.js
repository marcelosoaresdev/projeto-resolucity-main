// ============================================
// Mapa — RF-002: Visualização em Mapa
// ============================================

function escapeHtml(str) {
    if (str == null) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

const CENTER = [-22.5207, -44.0883];
const STATUS_CONFIG = {
    pendente:      { color: '#f59e0b', label: 'Pendente' },
    em_andamento:  { color: '#3b82f6', label: 'Em Andamento' },
    resolvido:     { color: '#22c55e', label: 'Resolvido' },
};

// Ícone Lucide inline (sem emoji)
const ICON_USER = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
const ICON_TAG = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2z"/><path d="M7 7h.01"/></svg>`;
const ICON_CALENDAR = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;
const ICON_MAP_PIN = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#146C43" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`;

// Ícone personalizado por status
function createIcon(status) {
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

// Formatar data para pt-BR com hora
function formatDateTime(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR') + ' às ' +
        d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

// Inicializar mapa
const map = L.map('map').setView(CENTER, 13);

// Camada OpenStreetMap
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

// Atualizar contadores
function updateCounts() {
    const withCoords = allReports.filter(r => r.latitude && r.longitude);
    document.getElementById('count-todos').textContent = withCoords.length;
    document.getElementById('count-pendente').textContent = withCoords.filter(r => r.status === 'pendente').length;
    document.getElementById('count-andamento').textContent = withCoords.filter(r => r.status === 'em_andamento').length;
    document.getElementById('count-resolvido').textContent = withCoords.filter(r => r.status === 'resolvido').length;
}

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
            <div class="popup-modal">
                <div class="popup-header">
                    <div class="popup-header-title">
                        ${ICON_MAP_PIN} ${escapeHtml(report.categoria)}
                    </div>
                    <button class="popup-close" onclick="this.closest('.leaflet-popup').remove()">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                </div>
                <div class="popup-body">
                    <div class="popup-row" style="margin-bottom:8px">
                        ${ICON_MAP_PIN}
                        <span style="color:#333;font-size:13px">${escapeHtml(report.endereco)}</span>
                    </div>
                    ${report.nome ? `
                    <div class="popup-row">
                        ${ICON_USER}
                        <span style="color:#555;font-size:13px">${escapeHtml(report.nome)}</span>
                    </div>
                    ` : ''}
                    ${report.tipo ? `
                    <div class="popup-row">
                        ${ICON_TAG}
                        <span style="color:#555;font-size:13px">${escapeHtml(report.tipo)}</span>
                    </div>
                    ` : ''}
                    <div class="popup-row">
                        ${ICON_CALENDAR}
                        <span style="color:#888;font-size:12px">${formatDateTime(report.criadoEm)}</span>
                    </div>
                </div>
                <div class="popup-footer">
                    <span style="background:${escapeHtml(color)};color:white;padding:5px 14px;border-radius:16px;font-size:12px;font-weight:600">${escapeHtml(label)}</span>
                </div>
            </div>
        `;

        const marker = L.marker([report.latitude, report.longitude], {
            icon: createIcon(report.status)
        }).bindPopup(popupHtml);

        markers.addLayer(marker);
    });
}

// Carregar relatórios
async function loadReports() {
    try {
        const res = await fetch('/api/reports');
        allReports = await res.json();
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