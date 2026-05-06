document.addEventListener('DOMContentLoaded', async () => {
  if (window.dashboardCharts && document.getElementById('catChart')) {
    const res = await fetch('/api/charts');
    const data = await res.json();
    const mk = (id, label, rows, type='bar') => new Chart(document.getElementById(id), {
      type,
      data: { labels: rows.map(r => r.label), datasets: [{ label, data: rows.map(r => r.value), borderWidth: 1, backgroundColor: ['#01696f','#0f4c81','#7a39bb','#964219','#437a22','#d19900'] }] },
      options: { responsive: true, maintainAspectRatio: false }
    });
    mk('catChart','Opportunities',data.byCategory,'doughnut');
    mk('statusChart','Applications',data.byStatus,'bar');
    mk('locChart','Locations',data.byLocation,'bar');
  }
  const form = document.getElementById('aiForm');
  if (form) {
    const messages = document.getElementById('aiMessages');
    const input = document.getElementById('aiInput');
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      const u = document.createElement('div');
      u.className = 'ai-bubble user';
      u.textContent = text;
      messages.appendChild(u);
      input.value = '';
      const r = await fetch('/api/ai/chat', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ message:text }) });
      const data = await r.json();
      const a = document.createElement('div');
      a.className = 'ai-bubble assistant';
      a.textContent = data.answer || 'No response.';
      messages.appendChild(a);
      messages.scrollTop = messages.scrollHeight;
    });
  }
});