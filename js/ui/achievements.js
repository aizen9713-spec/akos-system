function renderAchievements() {
  const list = document.getElementById("achievementList");

  if (!list) {
    return;
  }

  list.innerHTML = "";

  if (state.achievements.length === 0) {
    list.innerHTML = `<p class="muted">No achievements unlocked yet.</p>`;
    return;
  }

  state.achievements.forEach(achievement => {
    const card = document.createElement("div");
    card.className = "achievement-item";

    card.innerHTML = `
  <div class="achievement-head">
    <div class="achievement-title">
      <span class="achievement-icon">🏆</span>
      <strong>${escapeHtml(achievement.title)}</strong>
    </div>

    <span class="achievement-badge">UNLOCKED</span>
  </div>

  <div class="muted achievement-description">
    ${escapeHtml(achievement.description)}
  </div>
  <div class="achievement-date">
  UNLOCKED ${new Date(achievement.unlockedAt).toLocaleDateString()}
</div>
`;

    list.appendChild(card);
  });
}