// Browser connection indicator only; does not claim Cloud Sync or save success.
(() => {
 const label = document.getElementById('headerNetwork');
 if (!label) return;
 function update() {
  label.textContent = navigator.onLine ? 'NETWORK ONLINE' : 'OFFLINE · LOCAL MODE';
  label.dataset.connection = navigator.onLine ? 'online' : 'offline';
 }
 update();
 window.addEventListener('online', update);
 window.addEventListener('offline', update);
})();
