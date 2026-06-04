/* chart.js - RF003: Estatísticas com ApexCharts */

const COLOR_PENDENTE = '#f59e0b';
const COLOR_ANDAMENTO = '#3b82f6';
const COLOR_RESOLVIDO = '#22c55e';

let currentPeriod = 'all';
let customStart = null;
let customEnd = null;
let charts = {};
let pollingInterval = null;
let lastStats = null;

function isMobile() { return window.innerWidth <= 768; }

function formatMonthLabel(key) {
    const [year, month] = key.split('-');
    const date = new Date(year, parseInt(month) - 1);
    return date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
}

function getMonthLabels(keys) {
    return keys.map(formatMonthLabel);
}

function getTopN(obj, n = 10) {
    return Object.entries(obj)
        .sort((a, b) => b[1] - a[1])
        .slice(0, n)
        .reduce((acc, [k, v]) => { acc[k] = v; return acc; }, {});
}

/* Atualizar KPI cards */
function updateCountCards(stats) {
    const totalEl = document.getElementById('total-relatos');
    const pendentesEl = document.getElementById('relatos-pendentes');
    const andamentoEl = document.getElementById('relatos-andamento');
    const resolvidosEl = document.getElementById('relatos-resolvidos');

    if (totalEl) totalEl.textContent = stats.total || 0;
    if (pendentesEl) pendentesEl.textContent = stats.pendentes || 0;
    if (andamentoEl) andamentoEl.textContent = stats.emAndamento || 0;
    if (resolvidosEl) resolvidosEl.textContent = stats.resolvidos || 0;
}

/* Gráfico 1: Evolução Mensal (area) */
function createEvolucaoMensal(stats) {
    const container = document.getElementById('chart-evolucao-mensal');
    if (!container) return;

    const meses = Object.keys(stats.porMes || {});
    const valores = Object.values(stats.porMes || {});

    if (charts.evolucao) {
        charts.evolucao.updateSeries([{ name: 'Relatos', data: valores }]);
    } else {
        charts.evolucao = new ApexCharts(container, {
            series: [{ name: 'Relatos', data: valores }],
            chart: {
                type: 'area',
                height: 280,
                toolbar: { show: false },
                fontFamily: 'Inter, system-ui, sans-serif'
            },
            colors: ['#198754'],
            fill: {
                type: 'gradient',
                gradient: {
                    shadeIntensity: 1,
                    opacityFrom: 0.4,
                    opacityTo: 0.1,
                    stops: [0, 90, 100]
                }
            },
            stroke: { curve: 'smooth', width: 3 },
            dataLabels: { enabled: false },
            xaxis: {
                categories: getMonthLabels(meses),
                labels: { style: { colors: '#6b7280', fontSize: '11px' } },
                axisBorder: { show: false },
                axisTicks: { show: false }
            },
            yaxis: {
                labels: { style: { colors: '#6b7280', fontSize: '11px' }, formatter: v => Math.round(v) }
            },
            grid: { borderColor: 'rgba(0,0,0,0.05)', padding: { left: 10, right: 10 } },
            tooltip: { theme: 'dark', x: { show: true } }
        });
        charts.evolucao.render();
    }
}

/* Gráfico 2: Por Status (donut) */
function createStatusChart(stats) {
    const container = document.getElementById('chart-status');
    if (!container) return;

    if (charts.status) {
        charts.status.updateSeries([stats.pendentes || 0, stats.emAndamento || 0, stats.resolvidos || 0]);
    } else {
        charts.status = new ApexCharts(container, {
            series: [stats.pendentes || 0, stats.emAndamento || 0, stats.resolvidos || 0],
            chart: {
                type: 'donut',
                height: 280,
                fontFamily: 'Inter, system-ui, sans-serif'
            },
            colors: [COLOR_PENDENTE, COLOR_ANDAMENTO, COLOR_RESOLVIDO],
            labels: ['Pendentes', 'Em Andamento', 'Resolvidos'],
            plotOptions: {
                pie: {
                    donut: {
                        size: '65%',
                        labels: {
                            show: true,
                            name: { show: true, fontSize: '14px', fontWeight: 500 },
                            value: { show: true, fontSize: '20px', fontWeight: 700, formatter: v => Math.round(v) },
                            total: { show: true, label: 'Total', fontSize: '14px', color: '#6b7280', formatter: () => stats.total || 0 }
                        }
                    }
                }
            },
            dataLabels: { enabled: false },
            legend: { position: 'bottom', fontSize: '12px', labels: { colors: '#6b7280' } },
            tooltip: { theme: 'dark' }
        });
        charts.status.render();
    }
}

/* Gráfico 3: Por Categoria (bar horizontal) */
function createCategoriaChart(stats) {
    const container = document.getElementById('chart-categoria');
    if (!container) return;

    const sorted = getTopN(stats.porCategoria || {}, 10);
    const categories = Object.keys(sorted);
    const values = Object.values(sorted);

    if (charts.categoria) {
        charts.categoria.updateOptions({
            xaxis: { categories },
            series: [{ name: 'Total', data: values }]
        });
    } else {
        charts.categoria = new ApexCharts(container, {
            series: [{ name: 'Total', data: values }],
            chart: { type: 'bar', height: 280, toolbar: { show: false }, fontFamily: 'Inter, system-ui, sans-serif' },
            colors: ['#198754'],
            plotOptions: {
                bar: { horizontal: true, borderRadius: 6, barHeight: '60%', distributed: true }
            },
            dataLabels: { enabled: true, formatter: v => Math.round(v), style: { fontSize: '11px', fontWeight: 600 } },
            xaxis: { categories, labels: { style: { colors: '#6b7280', fontSize: '11px' }, formatter: v => Math.round(v) }, axisBorder: { show: false } },
            yaxis: { labels: { style: { colors: '#6b7280', fontSize: isMobile() ? '9px' : '11px' } } },
            grid: { borderColor: 'rgba(0,0,0,0.05)', padding: { left: 10, right: 10 } },
            tooltip: { theme: 'dark' }
        });
        charts.categoria.render();
    }
}

/* Gráfico 4: Por Bairro (bar horizontal) */
function createBairroChart(stats) {
    const container = document.getElementById('chart-bairro');
    if (!container) return;

    const sorted = getTopN(stats.porBairro || {}, 10);
    const categories = Object.keys(sorted);
    const values = Object.values(sorted);

    if (charts.bairro) {
        charts.bairro.updateOptions({
            xaxis: { categories },
            series: [{ name: 'Total', data: values }]
        });
    } else {
        charts.bairro = new ApexCharts(container, {
            series: [{ name: 'Total', data: values }],
            chart: { type: 'bar', height: 280, toolbar: { show: false }, fontFamily: 'Inter, system-ui, sans-serif' },
            colors: ['#3b82f6'],
            plotOptions: {
                bar: { horizontal: true, borderRadius: 6, barHeight: '60%', distributed: true }
            },
            dataLabels: { enabled: true, formatter: v => Math.round(v), style: { fontSize: '11px', fontWeight: 600 } },
            xaxis: { categories, labels: { style: { colors: '#6b7280', fontSize: '11px' }, formatter: v => Math.round(v) }, axisBorder: { show: false } },
            yaxis: { labels: { style: { colors: '#6b7280', fontSize: isMobile() ? '9px' : '11px' } } },
            grid: { borderColor: 'rgba(0,0,0,0.05)', padding: { left: 10, right: 10 } },
            tooltip: { theme: 'dark' }
        });
        charts.bairro.render();
    }
}

/* Gráfico 5: Resolvidos por Categoria (bar) */
function createResolvidosCategoriaChart(stats) {
    const container = document.getElementById('chart-resolvidos-categoria');
    if (!container) return;

    const sorted = getTopN(stats.resolvidosPorCategoria || {}, 10);
    const categories = Object.keys(sorted);
    const values = Object.values(sorted);

    if (charts.resolvidosCategoria) {
        charts.resolvidosCategoria.updateOptions({
            xaxis: { categories },
            series: [{ name: 'Resolvidos', data: values }]
        });
    } else {
        charts.resolvidosCategoria = new ApexCharts(container, {
            series: [{ name: 'Resolvidos', data: values }],
            chart: { type: 'bar', height: 280, toolbar: { show: false }, fontFamily: 'Inter, system-ui, sans-serif' },
            colors: ['#22c55e'],
            plotOptions: {
                bar: { horizontal: true, borderRadius: 6, barHeight: '60%', distributed: true }
            },
            dataLabels: { enabled: true, formatter: v => Math.round(v), style: { fontSize: '11px', fontWeight: 600 } },
            xaxis: { categories, labels: { style: { colors: '#6b7280', fontSize: '11px' }, formatter: v => Math.round(v) }, axisBorder: { show: false } },
            yaxis: { labels: { style: { colors: '#6b7280', fontSize: isMobile() ? '9px' : '11px' } } },
            grid: { borderColor: 'rgba(0,0,0,0.05)', padding: { left: 10, right: 10 } },
            tooltip: { theme: 'dark' }
        });
        charts.resolvidosCategoria.render();
    }
}

/* Gráfico 6: Evolução de Resolvidos (line) */
function createEvolucaoResolvidos(stats) {
    const container = document.getElementById('chart-evolucao-resolvidos');
    if (!container) return;

    const meses = Object.keys(stats.resolvidosPorMes || {});
    const valores = Object.values(stats.resolvidosPorMes || {});

    if (charts.evolucaoResolvidos) {
        charts.evolucaoResolvidos.updateSeries([{ name: 'Resolvidos', data: valores }]);
    } else {
        charts.evolucaoResolvidos = new ApexCharts(container, {
            series: [{ name: 'Resolvidos', data: valores }],
            chart: {
                type: 'line',
                height: 280,
                toolbar: { show: false },
                fontFamily: 'Inter, system-ui, sans-serif',
                zoom: { enabled: false }
            },
            colors: ['#22c55e'],
            stroke: { curve: 'smooth', width: 3 },
            markers: { size: 5, strokeWidth: 2, fillColors: ['#22c55e'] },
            dataLabels: { enabled: false },
            xaxis: {
                categories: getMonthLabels(meses),
                labels: { style: { colors: '#6b7280', fontSize: '11px' } },
                axisBorder: { show: false },
                axisTicks: { show: false }
            },
            yaxis: {
                labels: { style: { colors: '#6b7280', fontSize: '11px' }, formatter: v => Math.round(v) }
            },
            grid: { borderColor: 'rgba(0,0,0,0.05)', padding: { left: 10, right: 10 } },
            tooltip: { theme: 'dark', x: { show: true } }
        });
        charts.evolucaoResolvidos.render();
    }
}

/* Atualizar todos os gráficos */
function updateAllCharts(stats) {
    lastStats = stats;

    // Verificar se há dados
    const noDataEl = document.getElementById('no-data-message');
    if (stats.total === 0) {
        if (noDataEl) noDataEl.classList.remove('hidden');
        document.querySelectorAll('[id^="chart-"]').forEach(el => el.classList.add('hidden'));
        return;
    }
    if (noDataEl) noDataEl.classList.add('hidden');
    document.querySelectorAll('[id^="chart-"]').forEach(el => el.classList.remove('hidden'));

    updateCountCards(stats);
    createEvolucaoMensal(stats);
    createStatusChart(stats);
    createCategoriaChart(stats);
    createBairroChart(stats);
    createResolvidosCategoriaChart(stats);
    createEvolucaoResolvidos(stats);

    // Atualizar polling status
    const pollingStatus = document.getElementById('polling-status');
    if (pollingStatus) {
        pollingStatus.textContent = 'Atualizado ' + new Date().toLocaleTimeString('pt-BR');
    }
}

/* Carregar dados da API */
async function loadStats() {
    try {
        let url = '/api/stats';
        if (currentPeriod === 'custom' && customStart && customEnd) {
            url += `?period=custom&start=${customStart}&end=${customEnd}`;
        } else if (currentPeriod !== 'all') {
            url += `?period=${currentPeriod}`;
        }

        const res = await fetch(url);
        if (!res.ok) throw new Error('API error');
        const stats = await res.json();
        updateAllCharts(stats);
    } catch (err) {
        console.error('Erro ao carregar estatísticas:', err);
        const pollingStatus = document.getElementById('polling-status');
        if (pollingStatus) pollingStatus.textContent = 'Erro ao atualizar';
    }
}

/* Configurar polling */
function startPolling() {
    if (pollingInterval) clearInterval(pollingInterval);
    pollingInterval = setInterval(loadStats, 30000);
}

/* Configurar filtros de período */
function setupPeriodFilters() {
    const periodBtns = document.querySelectorAll('.period-btn');
    const customRange = document.getElementById('custom-date-range');
    const dateStart = document.getElementById('date-start');
    const dateEnd = document.getElementById('date-end');
    const applyCustom = document.getElementById('apply-custom');

    // Set max date to today
    const today = new Date().toISOString().split('T')[0];
    if (dateEnd) dateEnd.max = today;
    if (dateStart) dateStart.max = today;

    periodBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const period = btn.dataset.period;

            // Update UI
            periodBtns.forEach(b => {
                b.classList.remove('btn-primary');
                b.classList.add('btn-outline', 'border-base-300');
                b.setAttribute('aria-pressed', 'false');
            });
            btn.classList.remove('btn-outline', 'border-base-300');
            btn.classList.add('btn-primary');
            btn.setAttribute('aria-pressed', 'true');

            currentPeriod = period;

            // Show/hide custom date range
            if (period === 'custom') {
                if (customRange) customRange.classList.remove('hidden');
            } else {
                if (customRange) customRange.classList.add('hidden');
                loadStats();
            }
        });
    });

    // Apply custom date range
    if (applyCustom) {
        applyCustom.addEventListener('click', () => {
            const start = dateStart.value;
            const end = dateEnd.value;

            if (!start || !end) {
                alert('Selecione as datas de início e fim.');
                return;
            }

            if (new Date(start) > new Date(end)) {
                alert('Data de início não pode ser maior que data fim.');
                return;
            }

            customStart = start;
            customEnd = end;
            currentPeriod = 'custom';
            loadStats();
        });
    }
}

/* Resize handler */
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        if (lastStats) updateAllCharts(lastStats);
    }, 300);
});

/* Iniciar quando DOM carregado */
document.addEventListener('DOMContentLoaded', () => {
    setupPeriodFilters();
    loadStats();
    startPolling();
});
