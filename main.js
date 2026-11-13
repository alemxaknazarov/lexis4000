// Lexis 4000 System Status Script

document.addEventListener('DOMContentLoaded', () => {
  // Live Clock (Local / UTC+5)
  const clockEl = document.getElementById('live-clock');
  const updateClock = () => {
    if (!clockEl) return;
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-GB', { hour12: false });
    clockEl.textContent = `SYS.TIME: ${timeString}`;
  };
  updateClock();
  setInterval(updateClock, 1000);

  // Dynamic Ping Simulation
  const latencyEl = document.getElementById('latency-val');
  const pingBtn = document.getElementById('ping-btn');
  const refreshBtn = document.getElementById('refresh-btn');
  const refreshText = document.getElementById('refresh-btn-text');
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toast-message');
  const terminalLogs = document.getElementById('terminal-logs');

  let toastTimer = null;
  const showToast = (message) => {
    if (!toast) return;
    toastMsg.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 4000);
  };

  const addTerminalLog = (tag, text, type = 'info') => {
    if (!terminalLogs) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-GB', { hour12: false });
    const logLine = document.createElement('div');
    logLine.className = 'log-line';
    
    let colorClass = 'log-info';
    if (type === 'success') colorClass = 'log-success';
    if (type === 'warn') colorClass = 'log-warn';
    if (type === 'msg') colorClass = 'log-msg';

    logLine.innerHTML = `<span class="log-time">[${tag}]</span> <span class="${colorClass}">${text}</span>`;
    
    // Insert before the active cursor line
    const activeLine = terminalLogs.querySelector('.active-line');
    if (activeLine) {
      terminalLogs.insertBefore(logLine, activeLine);
    } else {
      terminalLogs.appendChild(logLine);
    }
  };

  // Ping Button Action
  if (pingBtn) {
    pingBtn.addEventListener('click', () => {
      pingBtn.classList.add('loading');
      setTimeout(() => {
        const fakePing = Math.floor(Math.random() * 15) + 12;
        if (latencyEl) latencyEl.textContent = `PING: ${fakePing}ms`;
        addTerminalLog('NET', `Gateway ping respond: ${fakePing}ms (HTTP 503 Maintenance)`, 'info');
        showToast(`Server javobi: ${fakePing}ms (Status: 503 Maintenance)`);
        pingBtn.classList.remove('loading');
      }, 450);
    });
  }

  // Refresh Button Action
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      refreshBtn.classList.add('loading');
      if (refreshText) refreshText.textContent = "Tekshirilmoqda...";

      setTimeout(() => {
        refreshBtn.classList.remove('loading');
        if (refreshText) refreshText.textContent = "Qayta tekshirish";
        addTerminalLog('CHK', "Sessiya qayta tekshirildi: Tizim hali profilaktikada.", 'warn');
        showToast("Tizim hali profilaktikada. Qayta tiklanish tez orada kutilmoqda.");
      }, 700);
    });
  }
});
