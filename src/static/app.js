document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  function setMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.classList.remove("hidden");

    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Selecione uma atividade --</option>';

      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const participants = details.participants || [];
        const spotsLeft = details.max_participants - participants.length;
        const participantsMarkup = participants.length > 0
          ? participants.map((participant) => `
              <li class="participant-item">
                <span>${participant}</span>
                <button class="participant-delete" data-activity-name="${name}" data-email="${participant}" aria-label="Unregister ${participant}">
                  🗑️
                </button>
              </li>
            `).join("")
          : '<li class="empty">No participants yet.</li>';

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <strong>Participants</strong>
            <ul class="participants-list">
              ${participantsMarkup}
            </ul>
          </div>
        `;

        activitiesList.appendChild(activityCard);

        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      document.querySelectorAll(".participant-delete").forEach((button) => {
        button.addEventListener("click", async () => {
          const activityName = button.dataset.activityName;
          const email = button.dataset.email;

          try {
            const response = await fetch(
              `/activities/${encodeURIComponent(activityName)}/signup?email=${encodeURIComponent(email)}`,
              { method: "DELETE" }
            );

            const result = await response.json();

            if (response.ok) {
              setMessage(result.message, "success");
              await fetchActivities();
            } else {
              setMessage(result.detail || "An error occurred", "error");
            }
          } catch (error) {
            setMessage("Failed to unregister. Please try again.", "error");
            console.error("Error unregistering participant:", error);
          }
        });
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        setMessage(result.message, "success");
        signupForm.reset();
        await fetchActivities();
      } else {
        setMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      setMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  fetchActivities();
});
