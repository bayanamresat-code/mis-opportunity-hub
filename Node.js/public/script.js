document.addEventListener("DOMContentLoaded", () => {
  const setMessage = (boxId, text, type) => {
    const box = document.getElementById(boxId);
    if (!box) return;
    box.className = `message-box ${type}`;
    box.textContent = text;
  };

  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = document.getElementById("login-email").value.trim();
      const password = document.getElementById("login-password").value.trim();

      if (!email || !password) {
        setMessage("login-message", "Please fill in email and password.", "error");
        return;
      }

      setMessage("login-message", "Demo mode: login is disabled in the static version.", "success");
      loginForm.reset();
    });
  }

  const signupForm = document.getElementById("signup-form");
  if (signupForm) {
    signupForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const fullname = document.getElementById("signup-fullname").value.trim();
      const email = document.getElementById("signup-email").value.trim();
      const password = document.getElementById("signup-password").value.trim();
      const role = document.getElementById("signup-role").value.trim();

      if (!fullname || !email || !password || !role) {
        setMessage("signup-message", "Please fill in all required fields.", "error");
        return;
      }

      setMessage("signup-message", "Demo mode: account creation is disabled in the static version.", "success");
      signupForm.reset();
    });
  }

  const contactForm = document.getElementById("contact-form");
  if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("contact-name").value.trim();
      const email = document.getElementById("contact-email").value.trim();
      const phone = document.getElementById("contact-phone").value.trim();
      const subject = document.getElementById("contact-subject").value.trim();
      const message = document.getElementById("contact-message").value.trim();

      if (!name || !email || !phone || !subject || !message) {
        setMessage("contact-message-box", "Please complete all contact form fields.", "error");
        return;
      }

      setMessage(
        "contact-message-box",
        "Demo mode: your message was validated successfully. Connect a service like Formspree to receive real submissions.",
        "success"
      );
      contactForm.reset();
    });
  }

  const opportunitiesContainer = document.getElementById("opportunities-container");
  if (opportunitiesContainer) {
    const category = opportunitiesContainer.dataset.category;
    loadOpportunities(category, opportunitiesContainer);
  }
});

async function loadOpportunities(category, container) {
  try {
    const response = await fetch("data.json");
    const data = await response.json();
    const items = data.opportunities.filter(item => item.category === category);

    if (!items.length) {
      container.innerHTML = `<p>No ${category} opportunities available right now.</p>`;
      return;
    }

    container.innerHTML = items.map(item => `
      <article class="job-card">
        <h3>${item.title}</h3>
        <p><strong>Business Name:</strong> ${item.business_name}</p>
        <p><strong>Owner Name:</strong> ${item.owner_name}</p>
        <p><strong>Email:</strong> ${item.email}</p>
        <p><strong>Phone:</strong> ${item.phone}</p>
        <p><strong>Location:</strong> ${item.location}</p>
        <p><strong>Description:</strong> ${item.description}</p>
      </article>
    `).join("");
  } catch (error) {
    container.innerHTML = `<p>Could not load data.json. Run the site with Live Server.</p>`;
  }
}
