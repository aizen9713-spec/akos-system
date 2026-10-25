// =========================
// SYSTEM NAVIGATION v1
// =========================

const navButtons = document.querySelectorAll(".nav-btn");

function showPage(pageName) {
  const pages = document.querySelectorAll(".app-page");

  pages.forEach(page => {
    page.classList.remove("active");
  });

  navButtons.forEach(button => {
    button.classList.remove("active");
  });

  const targetPage = document.getElementById(`page-${pageName}`);
  const targetButton = document.querySelector(
    `.nav-btn[data-page="${pageName}"]`
  );

  if (targetPage) {
    targetPage.classList.add("active");
  }

  if (targetButton) {
    targetButton.classList.add("active");
  }
}

navButtons.forEach(button => {
  button.addEventListener("click", () => {
    showPage(button.dataset.page);
  });
});