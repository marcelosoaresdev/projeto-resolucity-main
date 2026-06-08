let allReports = [];

const STATUS_CONFIG = {
    pendente:      { label: 'Pendente',     badge: 'badge-warning' },
    em_andamento:  { label: 'Em Andamento',  badge: 'badge-info' },
    resolvido:     { label: 'Resolvido',     badge: 'badge-success' },
};

const CENTER = [-22.5207, -44.0883];

const CATEGORIAS = [
    'Acessibilidade','Ciclismo','Comércio e Fiscalização','Corrupção e Má Gestão',
    'Drenagem','Educação','Habitação','Infraestrutura','Limpeza Urbana e Lixo',
    'Meio Ambiente','Obras','Redes Elétricas/Luz','Saúde Pública','Segurança','Transporte','Outros'
];

const TIPOS_POR_CATEGORIA = {
    'Acessibilidade': ['Rampa bloqueada','Piso irregular','Sem elevador'],
    'Ciclismo': ['Ciclofaixa danificada','Ausência de ciclofaixa'],
    'Comércio e Fiscalização': ['Calçada irregular','Propaganda irregular'],
    'Corrupção e Má Gestão': ['Denúncia anônima'],
    'Drenagem': ['Boca de lobo entupida','Alagamento'],
    'Educação': ['Escola sem manutenção'],
    'Habitação': ['Área de risco','Construção irregular'],
    'Infraestrutura': ['Buraco','Iluminação queimada','Calçada quebrada','Lombada','Placa indisível'],
    'Limpeza Urbana e Lixo': ['Lixo acumulado','Área contaminada'],
    'Meio Ambiente': ['Desmatamento','Poluição','Maus-tratos'],
    'Obras': ['Obra abandonada','Má sinalização'],
    'Redes Elétricas/Luz': ['Fiação exposta','Postes danificados'],
    'Saúde Pública': ['Acúmulo de insetos','Esgoto a céu aberto'],
    'Segurança': ['Furto','Vandalismo','Drogas'],
    'Transporte': ['Ponto de ônibus danificado','Placa de rua ausente'],
    'Outros': ['Outro problema']
};

// ============================================================
// TOAST NOTIFICATIONS (replace window.alert)
// ============================================================
function showToast(message, type = 'error') {
    const colors = {
        error:   { bg: '#FEE2E2', border: '#EF4444', text: '#991B1B', icon: '✕' },
        success: { bg: '#D1FAE5', border: '#22C55E', text: '#166534', icon: '✓' },
        info:    { bg: '#DBEAFE', border: '#3B82F6', text: '#1E40AF', icon: 'ℹ' }
    };
    const c = colors[type] || colors.error;
    const toast = document.createElement('div');
    toast.style.cssText = `
        position:fixed;bottom:24px;right:24px;z-index:99999;
        background:${c.bg};border:1px solid ${c.border};color:${c.text};
        padding:12px 20px;border-radius:12px;font-size:14px;font-weight:500;
        display:flex;align-items:center;gap:10px;
        box-shadow:0 4px 12px rgba(0,0,0,0.1);
        animation:slideUpToast 0.3s ease;
    `;
    toast.innerHTML = `<span style="font-size:16px">${c.icon}</span> ${message}`;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'slideDownToast 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

const styleSheet = document.createElement('style');
styleSheet.textContent = `
    @keyframes slideUpToast {
        from { opacity:0; transform:translateY(20px); }
        to   { opacity:1; transform:translateY(0); }
    }
    @keyframes slideDownToast {
        from { opacity:1; transform:translateY(0); }
        to   { opacity:0; transform:translateY(20px); }
    }
`;
document.head.appendChild(styleSheet);

// ============================================================
// DELETE CONFIRMATION MODAL (replace window.confirm)
// ============================================================
function openDeleteModal(reportId, callback) {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(0,0,0,0.5);backdrop-filter:blur(4px);animation:fadeInOverlay 0.2s ease';

    overlay.innerHTML = `
        <div style="background:white;border-radius:16px;max-width:400px;width:100%;padding:28px;text-align:center;animation:fadeInCard 0.25s ease">
            <div style="width:52px;height:52px;background:#FEE2E2;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14H6L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M9 6V4h6v2"></path></svg>
            </div>
            <h3 style="font-size:18px;font-weight:700;color:#111;margin:0 0 8px">Excluir relato?</h3>
            <p style="font-size:14px;color:#666;margin:0 0 24px">Esta ação não pode ser desfeita. O relato será removido permanentemente.</p>
            <div style="display:flex;gap:10px">
                <button id="btn-cancel-delete" style="flex:1;padding:10px;border:1px solid #e5e7eb;border-radius:10px;background:#f9fafb;cursor:pointer;font-size:14px;font-weight:500;color:#374151">Cancelar</button>
                <button id="btn-confirm-delete" style="flex:1;padding:10px;border:none;border-radius:10px;background:#EF4444;color:white;cursor:pointer;font-size:14px;font-weight:600">Excluir</button>
            </div>
        </div>
    `;

    const fadeStyle = document.createElement('style');
    fadeStyle.textContent = `
        @keyframes fadeInOverlay { from { opacity:0; } to { opacity:1; } }
        @keyframes fadeInCard { from { opacity:0; transform:scale(0.95); } to { opacity:1; transform:scale(1); } }
    `;
    document.head.appendChild(fadeStyle);

    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    document.getElementById('btn-cancel-delete').addEventListener('click', () => {
        overlay.remove();
        fadeStyle.remove();
        document.body.style.overflow = '';
    });

    document.getElementById('btn-confirm-delete').addEventListener('click', () => {
        overlay.remove();
        fadeStyle.remove();
        document.body.style.overflow = '';
        callback();
    });

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.remove();
            fadeStyle.remove();
            document.body.style.overflow = '';
        }
    });
}

// ============================================================
// MAP ICON HELPER
// ============================================================
function createMapIcon(status) {
    return L.divIcon({
        html: `<div style="background:#146C43;width:32px;height:32px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center">
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

// ============================================================
// FORMAT DATE
// ============================================================
function formatDate(isoString) {
    return new Date(isoString).toLocaleDateString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric'
    });
}

// ============================================================
// RENDER CARD
// ============================================================
function renderCard(report) {
    const { label, badge } = STATUS_CONFIG[report.status] || STATUS_CONFIG.pendente;
    return `
        <div class="card bg-base-100 border border-base-300 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
             style="display:flex;flex-direction:column;position:relative"
             onclick="openReportModal(${report.id})">
            <!-- Delete button on card (same row as status badge) -->
            <button class="btn-delete-report btn btn-ghost btn-xs btn-circle"
                    style="position:absolute;top:10px;right:10px;z-index:10;background:rgba(255,255,255,0.9);border:1px solid #e5e7eb;padding:4px"
                    onclick="event.stopPropagation();openDeleteConfirmModal(${report.id})"
                    title="Excluir relato">
                <i data-lucide="trash-2" class="w-3.5 h-3.5" style="color:#EF4444"></i>
            </button>

            <div class="card-body gap-3" style="overflow:hidden;padding-top:12px;padding-right:40px">
                <div class="flex items-center gap-2 flex-wrap">
                    <span class="text-xs text-base-content/50 font-medium">${report.categoria}</span>
                    <span class="${badge} badge badge-sm whitespace-nowrap">${label}</span>
                </div>
                <h3 class="font-semibold text-base-content" style="
                    display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;word-break:break-word
                ">${report.endereco}</h3>
                <p class="text-sm text-base-content/60 line-clamp-2">${report.descricao}</p>
                <div class="flex items-center gap-1.5 text-xs text-base-content/40 pt-1 border-t border-base-200">
                    <i data-lucide="calendar" class="w-3 h-3"></i>
                    Enviado em ${formatDate(report.criadoEm)}
                    ${report.protocolo ? `<span class="ml-2 text-primary-500">#${report.protocolo}</span>` : ''}
                </div>
            </div>
        </div>
    `;
}

// ============================================================
// DELETE CONFIRM MODAL (called from card button)
// ============================================================
window.openDeleteConfirmModal = function(reportId) {
    openDeleteModal(reportId, async () => {
        try {
            const res = await fetch(`/api/reports/${reportId}`, { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok) {
                showToast(data.message || 'Erro ao excluir relato.', 'error');
                return;
            }
            showToast('Relato excluído com sucesso!', 'success');
            loadRelatos();
        } catch (err) {
            showToast('Erro ao excluir relato. Tente novamente.', 'error');
            console.error(err);
        }
    });
};

// ============================================================
// VIEW REPORT MODAL
// ============================================================
window.openReportModal = function(reportId) {
    const report = allReports.find(r => r.id === reportId);
    if (!report) return;

    const { label } = STATUS_CONFIG[report.status] || STATUS_CONFIG.pendente;
    const dataCriacao = new Date(report.criadoEm);
    const dataFormatada = dataCriacao.toLocaleDateString('pt-BR') + ' às ' + dataCriacao.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const truncate = (str, max) => str && str.length > max ? str.slice(0, max) + '…' : str || '—';
    const addressDisplay = truncate(report.endereco, 150);
    const descDisplay = truncate(report.descricao, 500);

    const overlay = document.createElement('div');
    overlay.id = 'modal-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:100;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(0,0,0,0.5);backdrop-filter:blur(4px);overflow:hidden';

    const closeModal = () => {
        const existing = document.getElementById('modal-overlay');
        if (existing) existing.remove();
        document.documentElement.style.overflow = '';
    };

    overlay.innerHTML = `
        <div style="background:white;border-radius:16px;max-width:600px;width:100%;max-height:90vh;overflow-y:auto;padding:24px;position:relative;word-break:break-word;overflow-wrap:anywhere">
            <button id="modal-close-btn" style="position:absolute;top:16px;right:16px;background:none;border:none;font-size:24px;cursor:pointer;color:#888;line-height:1;width:32px;height:32px;display:flex;align-items:center;justify-content:center;border-radius:8px">&times;</button>

            <div style="margin-bottom:16px">
                <span style="background:${label === 'Pendente' ? '#b45309' : label === 'Em Andamento' ? '#1d4ed8' : '#15803d'};color:white;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600">${label}</span>
                ${report.protocolo ? `<span style="margin-left:8px;font-size:12px;color:#888">Protocolo: ${report.protocolo}</span>` : ''}
            </div>

            <h2 style="font-size:20px;font-weight:700;color:#222;margin:0 0 4px;word-break:break-word">${report.categoria} — ${report.tipo || '—'}</h2>
            <p style="color:#666;font-size:14px;margin:0 0 20px;word-break:break-word;overflow-wrap:anywhere">${addressDisplay}</p>

            <div style="border-top:1px solid #eee;padding-top:16px;margin-top:16px">
                <h3 style="font-size:14px;font-weight:600;color:#333;margin:0 0 12px">Dados do Relato</h3>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:13px">
                    <div><strong>Categoria:</strong> ${report.categoria}</div>
                    <div><strong>Tipo:</strong> ${report.tipo || '—'}</div>
                    <div class="col-span-2"><strong>Endereço:</strong> ${addressDisplay}</div>
                    <div class="col-span-2" style="word-break:break-word;overflow-wrap:anywhere"><strong>Descrição:</strong> ${descDisplay}</div>
                    <div class="col-span-2"><strong>Enviado em:</strong> ${dataFormatada}</div>
                </div>
            </div>

            <div style="border-top:1px solid #eee;padding-top:16px;margin-top:16px">
                <h3 style="font-size:14px;font-weight:600;color:#333;margin:0 0 12px">Dados do Usuário</h3>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:13px">
                    <div><strong>Nome:</strong> ${report.nome || '—'}</div>
                    <div><strong>CPF:</strong> ${report.cpf || '—'}</div>
                    <div><strong>Nascimento:</strong> ${report.nascimento ? new Date(report.nascimento).toLocaleDateString('pt-BR') : '—'}</div>
                    <div><strong>Telefone:</strong> ${report.telefone || '—'}</div>
                    <div class="col-span-2"><strong>Email:</strong> ${report.email || '—'}</div>
                </div>
            </div>

            <div style="border-top:1px solid #eee;padding-top:16px;margin-top:20px;display:flex;justify-content:flex-end">
                <button id="btn-open-edit" class="btn btn-sm bg-primary-500 text-white border-none gap-2 rounded-lg">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    Editar
                </button>
            </div>
        </div>
    `;

    document.documentElement.style.overflow = 'hidden';
    document.body.appendChild(overlay);

    document.getElementById('modal-close-btn').addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
    });

    document.getElementById('btn-open-edit').addEventListener('click', () => {
        closeModal();
        openEditModal(report);
    });
};

// ============================================================
// EDIT MODAL (with map and pin)
// ============================================================
function openEditModal(report) {
    let editLat = report.latitude ? parseFloat(report.latitude) : CENTER[0];
    let editLng = report.longitude ? parseFloat(report.longitude) : CENTER[1];
    let editMapInstance = null;
    let editPinMarker = null;

    const overlay = document.createElement('div');
    overlay.id = 'modal-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:200;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(0,0,0,0.5);backdrop-filter:blur(4px);overflow:hidden';

    const closeEdit = () => {
        const existing = document.getElementById('modal-overlay');
        if (existing) existing.remove();
        document.documentElement.style.overflow = '';
    };

    overlay.innerHTML = `
        <div style="background:white;border-radius:16px;max-width:640px;width:100%;max-height:90vh;overflow-y:auto;padding:24px;position:relative">
            <button id="modal-close-btn" style="position:absolute;top:16px;right:16px;background:none;border:none;font-size:24px;cursor:pointer;color:#888;line-height:1;width:32px;height:32px;display:flex;align-items:center;justify-content:center;border-radius:8px;z-index:10">&times;</button>

            <h2 style="font-size:20px;font-weight:700;color:#222;margin:0 0 20px">Editar Relato</h2>

            <form id="edit-report-form" class="flex flex-col gap-4">
                <div>
                    <label class="label"><span class="label-text font-medium text-sm">Categoria</span></label>
                    <select id="edit-categoria" class="select select-bordered w-full rounded-lg text-sm" required>
                        ${CATEGORIAS.map(c => `<option value="${c}" ${c === report.categoria ? 'selected' : ''}>${c}</option>`).join('')}
                    </select>
                </div>

                <div>
                    <label class="label"><span class="label-text font-medium text-sm">Tipo</span></label>
                    <select id="edit-tipo" class="select select-bordered w-full rounded-lg text-sm" required>
                        <option value="">Selecione o tipo</option>
                    </select>
                </div>

                <div>
                    <label class="label"><span class="label-text font-medium text-sm">Endereço</span></label>
                    <div style="position:relative">
                        <input id="edit-endereco" type="text" class="input input-bordered w-full rounded-lg text-sm pr-8" value="${report.endereco || ''}" required>
                        <div id="edit-endereco-status" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);display:none">
                            <span class="loading loading-spinner loading-xs text-success"></span>
                        </div>
                    </div>
                </div>

                <div>
                    <label class="label"><span class="label-text font-medium text-sm">Descrição</span></label>
                    <textarea id="edit-descricao" class="textarea textarea-bordered w-full rounded-lg text-sm" rows="3" required>${report.descricao || ''}</textarea>
                </div>

                <div>
                    <label class="label"><span class="label-text font-medium text-sm">Localização no mapa</span></label>
                    <div id="edit-map-container" style="height:220px;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;display:none;margin-top:4px">
                        <div id="edit-map" style="height:100%"></div>
                    </div>
                    <button type="button" id="btn-show-edit-map" class="btn btn-sm btn-outline gap-2 rounded-lg mt-2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                        ${report.latitude ? 'Alterar localização' : 'Selecionar no mapa'}
                    </button>
                </div>

                <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:8px">
                    <button type="button" id="btn-cancel-edit" class="btn btn-sm btn-outline gap-2 rounded-lg">Cancelar</button>
                    <button type="submit" id="btn-submit-edit" class="btn btn-sm bg-primary-500 text-white border-none gap-2 rounded-lg">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        Salvar
                    </button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(overlay);
    document.documentElement.style.overflow = 'hidden';

    // Populate tipo select
    const categoriaSelect = document.getElementById('edit-categoria');
    const tipoSelect = document.getElementById('edit-tipo');
    const enderecoInput = document.getElementById('edit-endereco');
    const enderecoStatus = document.getElementById('edit-endereco-status');

    const populateTipos = (categoria, selectedTipo) => {
        const tipos = TIPOS_POR_CATEGORIA[categoria] || [];
        tipoSelect.innerHTML = '<option value="">Selecione o tipo</option>' +
            tipos.map(t => `<option value="${t}" ${t === selectedTipo ? 'selected' : ''}>${t}</option>`).join('');
    };

    populateTipos(report.categoria, report.tipo);

    categoriaSelect.addEventListener('change', () => {
        populateTipos(categoriaSelect.value, '');
    });

    // Reverse geocode helper
    async function reverseGeocode(lat, lng) {
        const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&accept-language=pt-BR`;
        try {
            const res = await fetch(url, {
                headers: { 'User-Agent': 'Resolucity/1.0 (projeto-resolucity@example.com)' }
            });
            if (!res.ok) throw new Error('Nominatim error');
            const data = await res.json();
            return formatNominatimAddress(data.address);
        } catch {
            return null;
        }
    }

    function formatNominatimAddress(address) {
        if (!address) return '';
        const parts = [];
        if (address.road) parts.push(address.road);
        if (address.house_number) parts.push(address.house_number);
        if (address.neighbourhood || address.suburb) parts.push(address.neighbourhood || address.suburb);
        if (address.city || address.municipality) parts.push(address.city || address.municipality);
        if (address.state) parts.push(address.state);
        return parts.join(', ');
    }

    // Map toggle button
    document.getElementById('btn-show-edit-map').addEventListener('click', () => {
        const mapContainer = document.getElementById('edit-map-container');
        const btn = document.getElementById('btn-show-edit-map');
        mapContainer.style.display = 'block';
        btn.style.display = 'none';

        setTimeout(() => {
            if (!editMapInstance) {
                editMapInstance = L.map('edit-map').setView([editLat, editLng], 15);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; OpenStreetMap',
                    maxZoom: 19,
                }).addTo(editMapInstance);

                editPinMarker = L.marker([editLat, editLng], {
                    draggable: true,
                    icon: createMapIcon('pendente')
                }).addTo(editMapInstance);

                editMapInstance.on('click', async (e) => {
                    editPinMarker.setLatLng(e.latlng);
                    editLat = e.latlng.lat;
                    editLng = e.latlng.lng;
                    enderecoStatus.style.display = 'block';
                    const addr = await reverseGeocode(editLat, editLng);
                    if (addr) {
                        enderecoInput.value = addr;
                        enderecoStatus.style.display = 'none';
                    } else {
                        enderecoStatus.style.display = 'none';
                    }
                });

                editPinMarker.on('dragend', async () => {
                    const pos = editPinMarker.getLatLng();
                    editLat = pos.lat;
                    editLng = pos.lng;
                    enderecoStatus.style.display = 'block';
                    const addr = await reverseGeocode(editLat, editLng);
                    if (addr) {
                        enderecoInput.value = addr;
                        enderecoStatus.style.display = 'none';
                    }
                });
            } else {
                editMapInstance.invalidateSize();
            }
        }, 100);
    });

    // Close handlers
    document.getElementById('modal-close-btn').addEventListener('click', closeEdit);
    document.getElementById('btn-cancel-edit').addEventListener('click', closeEdit);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeEdit();
    });

    // Form submit
    document.getElementById('edit-report-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('btn-submit-edit');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="loading loading-spinner loading-sm"></span> Salvando...';

        const payload = {
            categoria: categoriaSelect.value,
            tipo: tipoSelect.value,
            endereco: enderecoInput.value,
            descricao: document.getElementById('edit-descricao').value,
            latitude: editLat,
            longitude: editLng
        };

        try {
            const res = await fetch(`/api/reports/${report.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (!res.ok) {
                showToast(data.message || 'Erro ao atualizar relato.', 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Salvar';
                return;
            }

            showToast('Relato atualizado com sucesso!', 'success');
            closeEdit();
            loadRelatos();
        } catch (err) {
            showToast('Erro ao atualizar relato. Tente novamente.', 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Salvar';
            console.error(err);
        }
    });
}

// ============================================================
// EMPTY STATE
// ============================================================
function renderEmpty(filterAtivo) {
    const msg = filterAtivo !== 'todos'
        ? `Nenhum relato com status <strong>${STATUS_CONFIG[filterAtivo]?.label ?? filterAtivo}</strong>.`
        : 'Você ainda não enviou nenhum relato.';
    return `
        <div class="col-span-full flex flex-col items-center gap-4 py-16 text-center">
            <div class="w-16 h-16 rounded-full bg-base-200 flex items-center justify-center">
                <i data-lucide="clipboard-x" class="w-8 h-8 text-base-content/30"></i>
            </div>
            <div>
                <p class="text-base-content/50 text-sm">${msg}</p>
                ${filterAtivo === 'todos' ? '<a href="/relatar" class="btn btn-sm bg-primary-500 text-white border-none mt-4">Fazer primeiro relato</a>' : ''}
            </div>
        </div>
    `;
}

// ============================================================
// LOAD RELATOS
// ============================================================
async function loadRelatos() {
    const grid     = document.getElementById('relatos-grid');
    const counter  = document.getElementById('relatos-count');
    const skeleton = document.getElementById('relatos-skeleton');

    try {
        const res = await fetch('/api/reports/mine');
        if (res.status === 401) { window.location.href = '/login'; return; }

        allReports = await res.json();
        skeleton.classList.add('hidden');
        grid.classList.remove('hidden');

        // Counter badges
        document.getElementById('count-todos').textContent      = allReports.length;
        document.getElementById('count-pendente').textContent  = allReports.filter(r => r.status === 'pendente').length;
        document.getElementById('count-andamento').textContent = allReports.filter(r => r.status === 'em_andamento').length;
        document.getElementById('count-resolvido').textContent = allReports.filter(r => r.status === 'resolvido').length;

        let filtroAtivo = 'todos';

        function render(filtro) {
            filtroAtivo = filtro;
            const lista = filtro === 'todos' ? allReports : allReports.filter(r => r.status === filtro);
            counter.textContent = `${lista.length} relato${lista.length !== 1 ? 's' : ''}`;
            grid.innerHTML = lista.length
                ? lista.map(renderCard).join('')
                : renderEmpty(filtro);
            lucide.createIcons();
        }

        render('todos');

        document.querySelectorAll('[data-filter]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('[data-filter]').forEach(b => b.classList.add('btn-outline'));
                btn.classList.remove('btn-outline');
                render(btn.dataset.filter);
            });
        });

    } catch (err) {
        skeleton.classList.add('hidden');
        grid.classList.remove('hidden');
        grid.innerHTML = `<div class="col-span-full text-center text-error text-sm py-10">Erro ao carregar relatos. Tente novamente.</div>`;
        console.error(err);
    }
}

document.addEventListener('DOMContentLoaded', loadRelatos);