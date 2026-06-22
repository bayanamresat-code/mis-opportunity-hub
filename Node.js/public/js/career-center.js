document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("careerInput");
  const send = document.getElementById("careerSend");
  const messages = document.getElementById("careerMessages");

  async function sendCareerMessage() {
    const message = input.value.trim();
    if (!message) return;

    messages.innerHTML += `<div class="user-message">${message}</div>`;
    input.value = "";

    try {
      const response = await fetch("/api/career-assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message })
      });

      const data = await response.json();
      messages.innerHTML += `<div class="bot-message">${data.reply}</div>`;
      messages.scrollTop = messages.scrollHeight;
    } catch (error) {
      messages.innerHTML += `<div class="bot-message">There was a problem connecting to the Career Assistant.</div>`;
    }
  }

  send.addEventListener("click", sendCareerMessage);

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      sendCareerMessage();
    }
  });
});
