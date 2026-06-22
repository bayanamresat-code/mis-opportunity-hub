document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("careerInput");
  const send = document.getElementById("careerSend");
  const messages = document.getElementById("careerMessages");
  const uploadBtn = document.getElementById("uploadCvBtn");
  const cvUpload = document.getElementById("cvUpload");
  function formatAIResponse(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/^### (.*$)/gim, "<h3>$1</h3>")
    .replace(/^## (.*$)/gim, "<h2>$1</h2>")
    .replace(/^# (.*$)/gim, "<h1>$1</h1>")
    .replace(/\n/g, "<br>");
}
  const suggestions = document.querySelectorAll(".career-suggestion");

  function scrollToBottom() {
    messages.scrollTop = messages.scrollHeight;
  }

  async function sendCareerMessage(messageText = null) {
    const message = messageText || input.value.trim();

    if (!message) return;

    messages.innerHTML += `
      <div class="user-message">
        👤 ${message}
      </div>
    `;

    input.value = "";

    messages.innerHTML += `
      <div class="bot-message thinking-message">
        🤖 AI Assistant is thinking...
      </div>
    `;

    scrollToBottom();

    try {
      const response = await fetch("/api/career-assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message })
      });

      const data = await response.json();

      const thinkingMessage =
        document.querySelector(".thinking-message");

      if (thinkingMessage) {
        thinkingMessage.remove();
      }

      messages.innerHTML += `
        <div class="bot-message">
  🤖 ${formatAIResponse(data.reply)}
</div>
      `;

      scrollToBottom();

    } catch (error) {

      const thinkingMessage =
        document.querySelector(".thinking-message");

      if (thinkingMessage) {
        thinkingMessage.remove();
      }

      messages.innerHTML += `
        <div class="bot-message">
          ❌ There was a problem connecting to the Career Assistant.
        </div>
      `;

      scrollToBottom();
    }
  }

  send.addEventListener("click", () => {
    sendCareerMessage();
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      sendCareerMessage();
    }
  });

  suggestions.forEach(button => {
    button.addEventListener("click", () => {
      const question = button.dataset.question;
      sendCareerMessage(question);
    });
  });
  uploadBtn.addEventListener("click", () => {
  cvUpload.click();
});

cvUpload.addEventListener("change", async () => {
  const file = cvUpload.files[0];

  if (!file) return;

  messages.innerHTML += `
    <div class="user-message">
      📄 Uploaded CV: ${file.name}
    </div>
  `;

  messages.innerHTML += `
    <div class="bot-message thinking-message">
      🤖 Analyzing your CV...
    </div>
  `;

  scrollToBottom();

  const formData = new FormData();
  formData.append("cv", file);

  try {
    const response = await fetch("/api/upload-cv", {
      method: "POST",
      body: formData
    });

    const data = await response.json();

    const thinkingMessage = document.querySelector(".thinking-message");
    if (thinkingMessage) {
      thinkingMessage.remove();
    }

    messages.innerHTML += `
      <div class="bot-message">
        🤖 ${formatAIResponse(data.reply)}
      </div>
    `;

    scrollToBottom();

  } catch (error) {
    const thinkingMessage = document.querySelector(".thinking-message");
    if (thinkingMessage) {
      thinkingMessage.remove();
    }

    messages.innerHTML += `
      <div class="bot-message">
        ❌ There was a problem analyzing the CV.
      </div>
    `;

    scrollToBottom();
  }
});
});

