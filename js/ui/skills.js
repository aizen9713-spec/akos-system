function renderSkills() {
  const grid = document.getElementById("skillsGrid");

  if (!grid) return;

  grid.innerHTML = "";

  Object.entries(state.skills).forEach(([skillKey, skill]) => {
    const card = document.createElement("div");
    card.className = "skill-item";

    card.innerHTML = `
      <div class="skill-top">
        <strong>${escapeHtml(skill.name)}</strong>
        <span class="skill-rank">${escapeHtml(skill.rank)}</span>
      </div>

      <div class="skill-xp">
        ${skill.xp} XP
      </div>

      <div class="skill-bar">
        <div
          class="skill-fill"
          style="width: ${Math.min(skill.xp, 100)}%"
        ></div>
      </div>
    `;

    grid.appendChild(card);
  });
}