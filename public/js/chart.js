/* chart.js - RF003: Dashboard de Estatísticas com ApexCharts */

const COLORS = {
    primary: '#146C43',
    blue: '#3b82f6',
    violet: '#8b5cf6',
    cyan: '#06b6d4',
    rose: '#f43f5e',
    emerald: '#10b981',
    amber: '#f59e0b',
    purple: '#a855f7',
    gray: '#6b7280',
    lightGray: '#f3f4f6'
};

let currentPeriod = '7d';
let customStart = null;
let customEnd = null;
let charts = {};
let pollingInterval = null;
let lastStats = null;

function isMobile() { return window.innerWidth <= 768; }

function formatMonthLabel(key) {
    const [year, month] = key.split('-');
    const date = new Date(year, parseInt(month) - 1);
    return date.toLocaleDateString('pt-BR', { month: 'short' });
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

function getAxisMax(values) {
    const max = values && values.length > 0 ? Math.max(...values) : 0;
    return max > 0 ? Math.ceil(max) : 5;
}

function baseGridOptions() {
    return {
        borderColor: '#f9fafb',
        strokeDashArray: 4,
        padding: { left: 0, right: 0 }
    };
}

/* Atualizar KPI cards */
function updateCountCards(stats) {
    document.getElementById('total-relatos').textContent = stats.total || 0;
    document.getElementById('relatos-pendentes').textContent = stats.pendentes || 0;
    document.getElementById('relatos-andamento').textContent = stats.emAndamento || 0;
    document.getElementById('relatos-resolvidos').textContent = stats.resolvidos || 0;
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
                height: 192,
                fontFamily: 'Inter, system-ui, sans-serif',
                toolbar: { show: false },
                zoom: { enabled: false },
                sparkline: { enabled: false }
            },
            colors: [COLORS.primary],
            fill: {
                type: 'gradient',
                gradient: {
                    shadeIntensity: 1,
                    opacityFrom: 0.15,
                    opacityTo: 0.02,
                    stops: [0, 100]
                }
            },
            stroke: { curve: 'smooth', width: 3, colors: [COLORS.primary] },
            dataLabels: { enabled: false },
            xaxis: {
                categories: getMonthLabels(meses),
                axisBorder: { show: false },
                axisTicks: { show: false },
                labels: { style: { colors: COLORS.gray, fontSize: '11px', fontWeight: 400 } }
            },
            yaxis: {
                labels: { style: { colors: COLORS.gray, fontSize: '11px', fontWeight: 400 }, formatter: v => Math.round(v) }
            },
            grid: baseGridOptions(),
            tooltip: { theme: 'dark', x: { show: true }, style: { fontSize: '12px' } }
        });
        charts.evolucao.render();
    }
}

/* Gráfico 2: Por Status (donut) */
function createStatusChart(stats) {
    const container = document.getElementById('chart-status');
    if (!container) return;

    const data = [stats.pendentes || 0, stats.emAndamento || 0, stats.resolvidos || 0];

    if (charts.status) {
        charts.status.updateSeries(data);
    } else {
        charts.status = new ApexCharts(container, {
            series: data,
            chart: {
                type: 'donut',
                height: 192,
                fontFamily: 'Inter, system-ui, sans-serif'
            },
            colors: [COLORS.amber, COLORS.blue, COLORS.emerald],
            labels: ['Pendentes', 'Em Andamento', 'Resolvidos'],
            plotOptions: {
                pie: {
                    donut: {
                        size: '70%',
                        labels: {
                            show: true,
                            name: { show: false },
                            value: {
                                show: true,
                                fontSize: '20px',
                                fontWeight: 700,
                                color: '#374151',
                                formatter: v => Math.round(v)
                            },
                            total: {
                                show: true,
                                label: 'Total',
                                fontSize: '12px',
                                color: COLORS.gray,
                                formatter: () => stats.total || 0
                            }
                        }
                    }
                }
            },
            dataLabels: { enabled: false },
            legend: {
                position: 'bottom',
                fontSize: '12px',
                labels: { colors: COLORS.gray },
                markers: { width: 8, height: 8, radius: 2 }
            },
            stroke: { width: 0 },
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
        charts.categoria.updateOptions({ xaxis: { categories, min: 0, max: getAxisMax(values), tickAmount: Math.max(1, getAxisMax(values)) }, series: [{ name: 'Total', data: values }] });
    } else {
        charts.categoria = new ApexCharts(container, {
            series: [{ name: 'Total', data: values }],
            chart: {
                type: 'bar',
                height: 192,
                fontFamily: 'Inter, system-ui, sans-serif',
                toolbar: { show: false }
            },
            colors: [COLORS.primary],
            plotOptions: {
                bar: {
                    horizontal: true,
                    borderRadius: 6,
                    barHeight: '60%',
                    endingShape: 'rounded'
                }
            },
            dataLabels: {
                enabled: true,
                formatter: v => Math.round(v),
                style: { fontSize: '10px', fontWeight: 600, colors: ['#fff'] }
            },
            xaxis: {
                categories,
                axisBorder: { show: false },
                axisTicks: { show: false },
                min: 0,
                max: getAxisMax(values),
                tickAmount: Math.max(1, getAxisMax(values)),
                labels: { style: { colors: COLORS.gray, fontSize: '10px', fontWeight: 400 }, formatter: v => Math.round(v) }
            },
            yaxis: { labels: { style: { colors: COLORS.gray, fontSize: isMobile() ? '9px' : '11px', fontWeight: 400 } } },
            grid: baseGridOptions(),
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
        charts.bairro.updateOptions({ xaxis: { categories, min: 0, max: getAxisMax(values), tickAmount: Math.max(1, getAxisMax(values)) }, series: [{ name: 'Total', data: values }] });
    } else {
        charts.bairro = new ApexCharts(container, {
            series: [{ name: 'Total', data: values }],
            chart: {
                type: 'bar',
                height: 192,
                fontFamily: 'Inter, system-ui, sans-serif',
                toolbar: { show: false }
            },
            colors: [COLORS.rose],
            plotOptions: {
                bar: {
                    horizontal: true,
                    borderRadius: 6,
                    barHeight: '60%',
                    endingShape: 'rounded'
                }
            },
            dataLabels: {
                enabled: true,
                formatter: v => Math.round(v),
                style: { fontSize: '10px', fontWeight: 600, colors: ['#fff'] }
            },
            xaxis: {
                categories,
                axisBorder: { show: false },
                axisTicks: { show: false },
                min: 0,
                max: getAxisMax(values),
                tickAmount: Math.max(1, getAxisMax(values)),
                labels: { style: { colors: COLORS.gray, fontSize: '10px', fontWeight: 400 }, formatter: v => Math.round(v) }
            },
            yaxis: { labels: { style: { colors: COLORS.gray, fontSize: isMobile() ? '9px' : '11px', fontWeight: 400 } } },
            grid: baseGridOptions(),
            tooltip: { theme: 'dark' }
        });
        charts.bairro.render();
    }
}

/* Gráfico 5: Resolvidos por Categoria */
function createResolvidosCategoriaChart(stats) {
    const container = document.getElementById('chart-resolvidos-categoria');
    if (!container) return;

    const sorted = getTopN(stats.resolvidosPorCategoria || {}, 10);
    const categories = Object.keys(sorted);
    const values = Object.values(sorted);

    if (charts.resolvidosCategoria) {
        charts.resolvidosCategoria.updateOptions({ xaxis: { categories, min: 0, max: getAxisMax(values), tickAmount: Math.max(1, getAxisMax(values)) }, series: [{ name: 'Resolvidos', data: values }] });
    } else {
        charts.resolvidosCategoria = new ApexCharts(container, {
            series: [{ name: 'Resolvidos', data: values }],
            chart: {
                type: 'bar',
                height: 192,
                fontFamily: 'Inter, system-ui, sans-serif',
                toolbar: { show: false }
            },
            colors: [COLORS.emerald],
            plotOptions: {
                bar: {
                    horizontal: true,
                    borderRadius: 6,
                    barHeight: '60%',
                    endingShape: 'rounded'
                }
            },
            dataLabels: {
                enabled: true,
                formatter: v => Math.round(v),
                style: { fontSize: '10px', fontWeight: 600, colors: ['#fff'] }
            },
            xaxis: {
                categories,
                axisBorder: { show: false },
                axisTicks: { show: false },
                min: 0,
                max: getAxisMax(values),
                tickAmount: Math.max(1, getAxisMax(values)),
                labels: { style: { colors: COLORS.gray, fontSize: '10px', fontWeight: 400 }, formatter: v => Math.round(v) }
            },
            yaxis: { labels: { style: { colors: COLORS.gray, fontSize: isMobile() ? '9px' : '11px', fontWeight: 400 } } },
            grid: baseGridOptions(),
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
                height: 192,
                fontFamily: 'Inter, system-ui, sans-serif',
                toolbar: { show: false },
                zoom: { enabled: false }
            },
            colors: [COLORS.emerald],
            stroke: { curve: 'smooth', width: 3 },
            markers: { size: 5, strokeWidth: 0, fillColor: COLORS.emerald },
            dataLabels: { enabled: false },
            xaxis: {
                categories: getMonthLabels(meses),
                axisBorder: { show: false },
                axisTicks: { show: false },
                labels: { style: { colors: COLORS.gray, fontSize: '11px', fontWeight: 400 } }
            },
            yaxis: {
                labels: { style: { colors: COLORS.gray, fontSize: '11px', fontWeight: 400 }, formatter: v => Math.round(v) }
            },
            grid: baseGridOptions(),
            tooltip: { theme: 'dark', x: { show: true } }
        });
        charts.evolucaoResolvidos.render();
    }
}

/* Atualizar todos os gráficos */
function updateAllCharts(stats) {
    lastStats = stats;

    const noDataEl = document.getElementById('no-data-message');
    const chartsVisible = stats.total > 0;

    if (!chartsVisible) {
        if (noDataEl) noDataEl.classList.remove('hidden');
        document.querySelectorAll('[id^="chart-"]').forEach(el => el.closest('.bg-white')?.classList.add('hidden'));
        return;
    }
    if (noDataEl) noDataEl.classList.add('hidden');
    document.querySelectorAll('.bg-white.rounded-2xl').forEach(el => el.classList.remove('hidden'));

    updateCountCards(stats);
    createEvolucaoMensal(stats);
    createStatusChart(stats);
    createCategoriaChart(stats);
    createBairroChart(stats);
    createResolvidosCategoriaChart(stats);
    createEvolucaoResolvidos(stats);

    const pollingStatus = document.getElementById('polling-status');
    if (pollingStatus) {
        pollingStatus.textContent = 'Atualizado ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
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

    const today = new Date().toISOString().split('T')[0];
    if (dateEnd) dateEnd.max = today;
    if (dateStart) dateStart.max = today;

    periodBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const period = btn.dataset.period;

            periodBtns.forEach(b => b.classList.remove('active', 'bg-primary-500', 'text-white'));
            btn.classList.add('active', 'bg-primary-500', 'text-white');

            currentPeriod = period;

            if (period === 'custom') {
                if (customRange) {
                    customRange.classList.remove('hidden');
                    customRange.classList.add('flex');
                }
            } else {
                if (customRange) {
                    customRange.classList.add('hidden');
                    customRange.classList.remove('flex');
                }
                loadStats();
            }
        });
    });

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
