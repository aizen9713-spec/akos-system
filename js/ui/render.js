function render() {
  renderPlayer();
  if (typeof CalendarUI !== "undefined") CalendarUI.render();
  renderStats();
  renderSkills();
  renderQuests();
  if (typeof QuestV2UI !== "undefined") QuestV2UI.render();
  renderDashboard();
  renderAchievements();
  renderSettings();
  renderSystemHealth();
  renderLog();
  Training.render();
  TrainingBuild2.render();
}