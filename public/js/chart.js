/* chart.js - Estatísticas com dados reais do banco (RF-003) */

const COLOR_YELLOW = "#ffcc00";

let pieChart = null;
let barChart = null;

function isMobile() { return window.innerWidth <= 768; }
function formatLabel(label) { return isMobile() && label.length > 18 ? label.substring(0,18) + "..." : label; }

/* Shadow plugin */
const shadowPlugin = {
  id: 'shadow',
  beforeDatasetsDraw(chart) {
    const ctx = chart.ctx;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.18)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;
  },
  afterDatasetsDraw(chart) { chart.ctx.restore(); }
};
Chart.register(shadowPlugin);

function baseOptions() {
  return {
    maintainAspectRatio: true,
    responsive: true,
    plugins: {
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        padding: 10,
        cornerRadius: 6
      }
    }
  };
}

/* Criar gráfico de pizza */
function createPie(stats) {
  const ctx = document.getElementById('pieChart').getContext('2d');
  const labels = Object.keys(stats.porCategoria);
  const data = Object.values(stats.porCategoria);
  const colors = labels.map((_, i) => `hsl(${Math.round(i*360/labels.length)},78%,62%)`);

  if (pieChart) { try { pieChart.destroy(); } catch(e){} }

  pieChart = new Chart(ctx, {
    type: 'pie',
    data: { labels, datasets: [{ data, backgroundColor: colors, borderColor: '#fff', borderWidth: 1 }] },
    options: Object.assign({}, baseOptions(), {
      aspectRatio: isMobile() ? 1 : 1.4,
      animation: { animateRotate: true, animateScale: true, duration: 900 },
      plugins: {
        legend: { position: isMobile() ? 'bottom' : 'right', labels: { boxWidth: 12, font: { size: isMobile() ? 9 : 11 }, padding: 10 } },
        tooltip: {
          callbacks: {
            label(ctx) {
              const total = data.reduce((a,b)=>a+b,0);
              const perc = ((ctx.raw/total)*100).toFixed(1);
              return `${ctx.label}: ${perc}%`;
            }
          }
        }
      }
    })
  });
}

/* Criar gráfico de barras */
function createBar(stats) {
  const ctx = document.getElementById('barChart').getContext('2d');
  const labels = Object.keys(stats.resolvidosPorCategoria);
  const data = Object.values(stats.resolvidosPorCategoria);
  const colors = labels.map((_, i) => `hsl(${Math.round(i*360/labels.length)},78%,62%)`);

  if (barChart) { try { barChart.destroy(); } catch(e){} }

  barChart = new Chart(ctx, {
    type: 'bar',
    data: { labels: labels.map(formatLabel), datasets: [{ label: 'Resolvidos', data, backgroundColor: colors, borderRadius: 8, borderWidth: 1, maxBarThickness: 60 }] },
    options: Object.assign({}, baseOptions(), {
      aspectRatio: isMobile() ? 1.2 : 1.6,
      animation: { duration: 900, easing: 'easeOutQuart' },
      scales: {
        x: { ticks: { color: '#222', font: { size: isMobile()?9:11 } }, grid: { display: false } },
        y: { beginAtZero: true, ticks: { color: '#222', font: { size: isMobile()?9:11 } }, grid: { color: 'rgba(0,0,0,0.07)' } }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title(ctx) { return labels[ctx[0].dataIndex]; },
            label(ctx) { return `Resolvidos: ${ctx.parsed.y}`; }
          }
        }
      }
    })
  });
}

/* Atualizar cards de contagem */
function updateCountCards(stats) {
  const totalEl = document.getElementById('total-relatos');
  const resolvidosEl = document.getElementById('relatos-resolvidos');
  const pendentesEl = document.getElementById('relatos-pendentes');

  if (totalEl) totalEl.textContent = stats.total;
  if (resolvidosEl) resolvidosEl.textContent = stats.resolvidos;
  if (pendentesEl) pendentesEl.textContent = stats.emAndamento;
}

/* Carregar dados e iniciar gráficos */
async function initAllCharts() {
  try {
    const res = await fetch('/api/stats');
    const stats = await res.json();

    // atualizar cards
    updateCountCards(stats);

    // criar gráficos
    createPie(stats);
    createBar(stats);
  } catch (err) {
    console.error('Erro ao carregar estatísticas:', err);
  }
}

/* Resize debounced */
let resizeTimer = null;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => initAllCharts(), 300);
});

/* Iniciar quando DOM carregado */
document.addEventListener('DOMContentLoaded', initAllCharts);