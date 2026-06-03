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
            <div style="min-width:220px">
                <h3 style="margin:0 0 6px;font-weight:600;font-size:14px;color:#146C43">
                    ${escapeHtml(report.categoria)}
                </h3>
                <p style="margin:0 0 4px;font-size:13px;color:#333">${escapeHtml(report.endereco)}</p>
                ${report.nome ? `<p style="margin:0 0 4px;font-size:12px;color:#666">👤 ${escapeHtml(report.nome)}</p>` : ''}
                ${report.tipo ? `<p style="margin:0 0 4px;font-size:12px">📋 Tipo: ${escapeHtml(report.tipo)}</p>` : ''}
                <p style="margin:0 0 6px;font-size:12px">📅 ${formatDateTime(report.criadoEm)}</p>
                <div style="display:flex;align-items:center;gap:6px">
                    <span style="background:${escapeHtml(color)};color:white;padding:2px 10px;border-radius:12px;font-size:11px;font-weight:500">${escapeHtml(label)}</span>
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