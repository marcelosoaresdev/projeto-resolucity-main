let allReports = [];

const STATUS_CONFIG = {
    pendente:      { label: 'Pendente',      badge: 'badge-warning' },
    em_andamento:  { label: 'Em Andamento',  badge: 'badge-info' },
    resolvido:     { label: 'Resolvido',     badge: 'badge-success' },
};

function formatDate(isoString) {
    return new Date(isoString).toLocaleDateString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric'
    });
}

function renderCard(report) {
    const { label, badge } = STATUS_CONFIG[report.status] || STATUS_CONFIG.pendente;
    return `
        <div class="card bg-base-100 border border-base-300 shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
             style="display:flex;flex-direction:column"
             onclick="openReportModal(${report.id})">
            <div class="card-body gap-3" style="overflow:hidden">
                <div class="flex items-start justify-between gap-3">
                    <div class="flex-1 min-width-0">
                        <span class="text-xs text-base-content/50 font-medium">${report.categoria}</span>
                        <h3 class="font-semibold text-base-content mt-0.5" style="
                            display: -webkit-box;
                            -webkit-line-clamp: 2;
                            -webkit-box-orient: vertical;
                            overflow: hidden;
                            word-break: break-word;
                        ">${report.endereco}</h3>
                    </div>
                    <span class="badge ${badge} badge-sm whitespace-nowrap flex-shrink-0">${label}</span>
                </div>
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

window.openReportModal = function(reportId) {
    const report = allReports.find(r => r.id === reportId);
    if (!report) return;

    const { label } = STATUS_CONFIG[report.status] || STATUS_CONFIG.pendente;
    const dataCriacao = new Date(report.criadoEm);
    const dataFormatada = dataCriacao.toLocaleDateString('pt-BR') + ' às ' + dataCriacao.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const overlay = document.createElement('div');
    overlay.id = 'modal-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:100;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(0,0,0,0.5);backdrop-filter:blur(4px)';

    const closeModal = () => {
        const existing = document.getElementById('modal-overlay');
        if (existing) existing.remove();
    };

    overlay.innerHTML = `
        <div style="background:white;border-radius:16px;max-width:600px;width:100%;max-height:90vh;overflow-y:auto;padding:24px;position:relative">
            <button id="modal-close-btn" style="position:absolute;top:16px;right:16px;background:none;border:none;font-size:24px;cursor:pointer;color:#888;line-height:1;width:32px;height:32px;display:flex;align-items:center;justify-content:center;border-radius:8px">&times;</button>

            <div style="margin-bottom:16px">
                <span style="background:#146C43;color:white;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600">${label}</span>
                ${report.protocolo ? `<span style="margin-left:8px;font-size:12px;color:#888">Protocolo: ${report.protocolo}</span>` : ''}
            </div>

            <h2 style="font-size:20px;font-weight:700;color:#222;margin:0 0 4px">${report.categoria} — ${report.tipo || '—'}</h2>
            <p style="color:#666;font-size:14px;margin:0 0 20px">${report.endereco}</p>

            <div style="border-top:1px solid #eee;padding-top:16px;margin-top:16px">
                <h3 style="font-size:14px;font-weight:600;color:#333;margin:0 0 12px">Dados do Relato</h3>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:13px">
                    <div><strong>Categoria:</strong> ${report.categoria}</div>
                    <div><strong>Tipo:</strong> ${report.tipo || '—'}</div>
                    <div class="col-span-2"><strong>Endereço:</strong> ${report.endereco}</div>
                    <div class="col-span-2"><strong>Descrição:</strong> ${report.descricao}</div>
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
        </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById('modal-close-btn').addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
    });
};

function renderEmpty(filterAtivo) {
    const msg = filterAtivo !== 'todos'
        ? `Nenhum relato com status <strong>${STATUS_CONFIG[filterAtivo]?.label ?? filterAtivo}</strong>.`
        : 'Voce ainda nao enviou nenhum relato.';
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

        // Contadores dos filtros
        document.getElementById('count-todos').textContent      = allReports.length;
        document.getElementById('count-pendente').textContent    = allReports.filter(r => r.status === 'pendente').length;
        document.getElementById('count-andamento').textContent   = allReports.filter(r => r.status === 'em_andamento').length;
        document.getElementById('count-resolvido').textContent   = allReports.filter(r => r.status === 'resolvido').length;

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