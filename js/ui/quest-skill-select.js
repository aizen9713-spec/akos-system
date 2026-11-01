// Presentation-only enhancement: the original select remains the reward value source.
// app.js initializes state after this script; wait for all classic scripts.
document.addEventListener('DOMContentLoaded', () => {
  const select = document.getElementById('questSkillInput');
  if (!select) return;
  select.replaceChildren(new Option('No skill', ''), ...Object.entries(state.skills).map(([key, skill]) => new Option(skill.name, key)));
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.id = 'questSkillTrigger';
  trigger.setAttribute('role', 'combobox');
  trigger.setAttribute('aria-label', 'Reward skill');
  trigger.setAttribute('aria-haspopup', 'listbox');
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-controls', 'questSkillList');
  const list = document.createElement('div');
  list.id = 'questSkillList';
  list.className = 'quest-stat-list';
  list.setAttribute('role', 'listbox');
  list.setAttribute('aria-label', 'Reward skill');
  list.hidden = true;
  let active = 0, displayedValue;
  const options = Array.from(select.options, (option, index) => {
    const row = document.createElement('div');
    row.id = `questSkillOption${index}`;
    row.setAttribute('role', 'option');
    row.dataset.value = option.value;
    const icon = document.createElement('span');
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = option.value ? skillIcon(option.value) : '—';
    const label = document.createElement('span');
    label.textContent = option.textContent;
    const check = document.createElement('span');
    check.className = 'quest-stat-check';
    check.setAttribute('aria-hidden', 'true');
    check.textContent = '✓';
    row.append(icon, label, check);
    row.addEventListener('pointerdown', event => event.preventDefault());
    row.addEventListener('click', () => choose(index));
    list.append(row);
    return row;
  });
  function sync() {
    const selected = Math.max(0, select.selectedIndex);
    if (displayedValue === select.value) return;
    displayedValue = select.value;
    trigger.replaceChildren(...Array.from(options[selected].children).slice(0, 2).map(node => node.cloneNode(true)));
    options.forEach((row, index) => row.setAttribute('aria-selected', String(index === selected)));
  }
  function highlight(index) {
    active = index;
    options.forEach((row, i) => row.classList.toggle('is-active', i === active));
    trigger.setAttribute('aria-activedescendant', options[active].id);
    options[active].scrollIntoView({ block: 'nearest' });
  }
  function place() {
    if (list.hidden) return;
    const rect = trigger.getBoundingClientRect();
    if (!rect.width || !rect.height) { close(); return; }
    const viewport = window.visualViewport;
    const left = viewport?.offsetLeft || 0, top = viewport?.offsetTop || 0;
    const width = viewport?.width || innerWidth, height = viewport?.height || innerHeight;
    const below = top + height - rect.bottom - 8, above = rect.top - top - 8;
    const upwards = below < Math.min(list.scrollHeight, 360) && above > below;
    list.style.width = `${Math.min(Math.max(rect.width, 320), width - 16)}px`;
    list.style.maxHeight = `${Math.max(44, Math.min(360, upwards ? above : below))}px`;
    list.style.left = `${Math.max(left + 8, Math.min(rect.left, left + width - list.getBoundingClientRect().width - 8))}px`;
    list.style.top = `${upwards ? rect.top - list.getBoundingClientRect().height - 4 : rect.bottom + 4}px`;
  }
  function open() {
    sync();
    list.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    place();
    highlight(Math.max(0, select.selectedIndex));
  }
  function close() {
    list.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    trigger.removeAttribute('aria-activedescendant');
  }
  function choose(index) {
    select.value = options[index].dataset.value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
    close();
    trigger.focus({ preventScroll: true });
  }
  trigger.addEventListener('click', () => list.hidden ? open() : close());
  trigger.addEventListener('focus', sync);
  trigger.addEventListener('keydown', event => {
    const key = event.key;
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(key)) {
      event.preventDefault();
      const wasClosed = list.hidden;
      if (wasClosed) open();
      highlight(key === 'Home' ? 0 : key === 'End' ? options.length - 1 : wasClosed ? active : (active + (key === 'ArrowDown' ? 1 : -1) + options.length) % options.length);
    } else if (key === 'Enter' || key === ' ') {
      event.preventDefault();
      if (list.hidden) open(); else choose(active);
    } else if (key === 'Escape') {
      if (!list.hidden) { event.preventDefault(); close(); }
    } else if (key === 'Tab') close();
    else if (key.length === 1 && /[a-z]/i.test(key)) {
      const index = Array.from(select.options).findIndex(option => option.textContent.toLowerCase().startsWith(key.toLowerCase()));
      if (index >= 0) { event.preventDefault(); if (list.hidden) open(); highlight(index); }
    }
  });
  trigger.addEventListener('blur', close);
  document.addEventListener('pointerdown', event => {
    if (!list.contains(event.target) && !trigger.contains(event.target)) close();
  });
  window.addEventListener('resize', place);
  document.addEventListener('scroll', place, true);
  window.visualViewport?.addEventListener('resize', place);
  window.visualViewport?.addEventListener('scroll', place);
  select.addEventListener('change', sync);
  // Creation resets the native value without a change event.
  document.addEventListener('click', () => queueMicrotask(sync));
  window.syncQuestSkillSelector = sync;
  select.after(trigger);
  document.body.append(list);
  sync();
  select.hidden = true;
}, { once: true });
