function renderLog() {
  const list = document.getElementById("logList");
  list.innerHTML = "";

  state.log.forEach(item => {
    const row = document.createElement("div");
    row.className = "log-item";
    row.textContent = item.text;
    list.appendChild(row);
  });
  
}