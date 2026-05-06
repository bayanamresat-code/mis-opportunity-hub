document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('aiForm');
  const input = document.getElementById('aiInput');
  const messages = document.getElementById('aiMessages');
  if (!form || !input || !messages) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    const userBubble = document.createElement('div');
    userBubble.className = 'ai-bubble user';
    userBubble.textContent = text;
    messages.appendChild(userBubble);
    input.value = '';

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });
      const data = await response.json();
      const aiBubble = document.createElement('div');
      aiBubble.className = 'ai-bubble assistant';
      aiBubble.textContent = data.answer || 'No response.';
      messages.appendChild(aiBubble);
      messages.scrollTop = messages.scrollHeight;
    } catch {
      const errBubble = document.createElement('div');
      errBubble.className = 'ai-bubble assistant';
      errBubble.textContent = 'Failed to contact AI assistant.';
      messages.appendChild(errBubble);
    }
  });
});