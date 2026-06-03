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
        <div class="card bg-base-100 border border-base-300 shadow-sm hover:shadow-md transition-shadow">
            <div class="card-body gap-3">
                <div class="flex items-start justify-between gap-3">
                    <div>
                        <span class="text-xs text-base-content/50 font-medium">${report.categoria}</span>
                        <h3 class="font-semibold text-base-content mt-0.5">${report.endereco}</h3>
                    </div>
                    <span class="badge ${badge} badge-sm whitespace-nowrap">${label}</span>
                </div>
                <p class="text-sm text-base-content/60 line-clamp-2">${report.descricao}</p>
                <div class="flex items-center gap-1.5 text-xs text-base-content/40 pt-1 border-t border-base-200">
                    <i data-lucide="calendar" class="w-3 h-3"></i>
                    Enviado em ${formatDate(report.criadoEm)}
                </div>
            </div>
        </div>
    `;
}

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

async function loadRelatos() {
    const grid     = document.getElementById('relatos-grid');
    const counter  = document.getElementById('relatos-count');
    const skeleton = document.getElementById('relatos-skeleton');

    try {
        const res = await fetch('/api/reports/mine');
        if (res.status === 401) { window.location.href = '/login'; return; }

        const allReports = await res.json();
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
