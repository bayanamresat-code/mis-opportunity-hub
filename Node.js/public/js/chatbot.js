document.addEventListener("DOMContentLoaded", () => {
  const button = document.createElement("button");
  button.className = "chatbot-button";
  button.innerHTML = "💬";

  const box = document.createElement("div");
  box.className = "chatbot-box";

  box.innerHTML = `
    <div class="chatbot-header">MS Opportunity Hub Assistant</div>

    <div class="chatbot-messages" id="chatbotMessages">
      <div class="bot-message">
        שלום! אני העוזר החכם של האתר. אפשר לשאול אותי איך להשתמש במערכת 😊
      </div>
    </div>

    <div class="chatbot-input">
      <input id="chatbotInput" type="text" placeholder="כתבי שאלה..." />
      <button id="chatbotSend">שלח</button>
    </div>
  `;

  document.body.appendChild(button);
  document.body.appendChild(box);

  button.addEventListener("click", () => {
    box.style.display = box.style.display === "flex" ? "none" : "flex";
  });

  const input = document.getElementById("chatbotInput");
  const send = document.getElementById("chatbotSend");
  const messages = document.getElementById("chatbotMessages");

  async function sendMessage() {
    const message = input.value.trim();
    if (!message) return;

    messages.innerHTML += `<div class="user-message">${message}</div>`;
    input.value = "";

    try {
      const response = await fetch("/api/chatbot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message,
          mode: "site-help"
        })
      });

      const data = await response.json();
      messages.innerHTML += `<div class="bot-message">${data.reply}</div>`;
      messages.scrollTop = messages.scrollHeight;
    } catch (error) {
      messages.innerHTML += `<div class="bot-message">אירעה שגיאה בחיבור לעוזר.</div>`;
    }
  }

  send.addEventListener("click", sendMessage);

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  });
});
