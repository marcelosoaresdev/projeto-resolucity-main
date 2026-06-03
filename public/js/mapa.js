// Mapa com Leaflet - RF-002: Visualização em Mapa

// Centro: Volta Redonda, RJ
const CENTER = [-22.5207, -44.0883];
const STATUS_CONFIG = {
    pendente:      { color: '#f59e0b', label: 'Pendente' },
    em_andamento:  { color: '#3b82f6', label: 'Em Andamento' },
    resolvido:     { color: '#22c55e', label: 'Resolvido' },
};

// Inicializar mapa
const map = L.map('map').setView(CENTER, 13);

// Camada OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap',
    maxZoom: 19,
}).addTo(map);

let allReports = [];
let markers = [];

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

// Gerar coordenadas aleatórias perto de Volta Redonda
function randomCoords() {
    return [
        CENTER[0] + (Math.random() - 0.5) * 0.08,
        CENTER[1] + (Math.random() - 0.5) * 0.08
    ];
}

// Formatar data para pt-BR
function formatDate(iso) {
    return new Date(iso).toLocaleDateString('pt-BR');
}

// Adicionar marcadores ao mapa
function renderMarkers(filter = 'todos') {
    // Limpar marcadores antigos
    markers.forEach(m => map.removeLayer(m));
    markers = [];

    const filtered = filter === 'todos'
        ? allReports
        : allReports.filter(r => r.status === filter);

    filtered.forEach(report => {
        const [lat, lng] = randomCoords();
        const { color, label } = STATUS_CONFIG[report.status] || STATUS_CONFIG.pendente;

        const popup = `
            <div style="min-width:200px">
                <h3 style="margin:0 0 4px;font-weight:600;font-size:14px">${report.categoria}</h3>
                <p style="margin:0 0 6px;font-size:12px;color:#666">${report.endereco}</p>
                <p style="margin:0 0 6px;font-size:12px">${report.descricao.substring(0, 80)}${report.descricao.length > 80 ? '...' : ''}</p>
                <div style="display:flex;align-items:center;gap:6px;margin-top:8px">
                    <span style="background:${color};color:white;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:500">${label}</span>
                    <span style="font-size:11px;color:#888">${formatDate(report.criadoEm)}</span>
                </div>
            </div>
        `;

        const marker = L.marker([lat, lng], { icon: createIcon(report.status) })
            .addTo(map)
            .bindPopup(popup);

        markers.push(marker);
    });
}

// Carregar relatórios do servidor
async function loadReports() {
    try {
        const res = await fetch('/api/reports');
        allReports = await res.json();

        // Atualizar contadores
        document.getElementById('count-todos').textContent = allReports.length;
        document.getElementById('count-pendente').textContent = allReports.filter(r => r.status === 'pendente').length;
        document.getElementById('count-andamento').textContent = allReports.filter(r => r.status === 'em_andamento').length;
        document.getElementById('count-resolvido').textContent = allReports.filter(r => r.status === 'resolvido').length;

        // Mostrar mensagem se não houver relatórios
        const msg = document.getElementById('no-reports-msg');
        if (allReports.length === 0) {
            msg.classList.remove('hidden');
        } else {
            msg.classList.add('hidden');
        }

        renderMarkers('todos');
    } catch (err) {
        console.error('Erro ao carregar relatórios:', err);
    }
}

// Filtro por status
document.querySelectorAll('[data-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('[data-filter]').forEach(b => b.classList.add('btn-outline'));
        btn.classList.remove('btn-outline');
        renderMarkers(btn.dataset.filter);
    });
});

// Iniciar
document.addEventListener('DOMContentLoaded', loadReports);