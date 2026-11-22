// Home Cafe Петергоф: строка разделов в шапке, вкладки меню и статус «открыто / закрыто».
(() => {
  'use strict';

  /* ---------- Шапка: затухание краёв строки разделов в старых браузерах ---------- */
  // Где нет анимаций по прокрутке, края показываем по IntersectionObserver
  const topNav = document.querySelector('.top__nav');
  if (topNav && !CSS.supports('animation-timeline', 'scroll()')) {
    topNav.classList.add('no-sda');
    const first = topNav.firstElementChild, last = topNav.lastElementChild;
    const io = new IntersectionObserver(entries => {
      for (const { target, intersectionRatio } of entries) {
        topNav.classList.toggle(target === first ? 'more-start' : 'more-end', intersectionRatio < 1);
      }
    }, { root: topNav, threshold: 1, rootMargin: '1px' });
    io.observe(first);
    io.observe(last);
  }

  /* ---------- Вкладки меню ---------- */
  const tablist = document.querySelector('[role="tablist"]');
  if (tablist) {
    const tabs = [...tablist.querySelectorAll('[role="tab"]')];
    const panels = tabs.map(t => document.querySelector(`[role="tabpanel"][aria-labelledby="${t.id}"]`));
    const nativeFocusgroup = Object.hasOwn(HTMLElement.prototype, 'focusGroup');

    function select(tab, { focus = false } = {}) {
      tabs.forEach((t, i) => {
        const on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.toggleAttribute('focusgroupstart', on);
        if (!nativeFocusgroup) t.tabIndex = on ? 0 : -1;
        const p = panels[i];
        if (!p) return;
        if (on) { p.hidden = false; p.tabIndex = 0; }
        else { p.hidden = 'until-found'; p.removeAttribute('tabindex'); }
      });
      if (focus) tab.focus();
      tab.scrollIntoView({ block: 'nearest', inline: 'nearest', container: 'nearest' });
    }

    tabs.forEach(tab => tab.addEventListener('click', () => select(tab)));
    tablist.addEventListener('focusin', e => {
      const tab = e.target.closest('[role="tab"]');
      if (tab && tab.getAttribute('aria-selected') !== 'true') select(tab);
    });

    if (!nativeFocusgroup) {
      tabs.forEach(t => { t.tabIndex = t.getAttribute('aria-selected') === 'true' ? 0 : -1; });
      tablist.addEventListener('keydown', e => {
        const i = tabs.indexOf(document.activeElement);
        if (i < 0) return;
        let next = null;
        if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
        else if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
        else if (e.key === 'Home') next = tabs[0];
        else if (e.key === 'End') next = tabs[tabs.length - 1];
        if (next) { e.preventDefault(); select(next, { focus: true }); }
      });
    }

    // Поиск по странице (Ctrl+F) открыл скрытую вкладку — переключаем на неё
    panels.forEach((p, i) => p && p.addEventListener('beforematch', () => select(tabs[i])));

    if (!CSS.supports('animation-timeline', 'scroll()')) {
      tablist.classList.add('no-sda');
      const first = tabs[0], last = tabs[tabs.length - 1];
      const io = new IntersectionObserver(entries => {
        for (const { target, intersectionRatio } of entries) {
          tablist.classList.toggle(target === first ? 'more-start' : 'more-end', intersectionRatio < 1);
        }
      }, { root: tablist, threshold: 1, rootMargin: '1px' });
      io.observe(first);
      io.observe(last);
    }
  }

  /* ---------- Открыто сейчас? (московское время) ---------- */
  // Пн–Чт 12–22, Пт–Сб 12–23, Вс 12–22
  const HOURS = { Mon: [12, 22], Tue: [12, 22], Wed: [12, 22], Thu: [12, 22], Fri: [12, 23], Sat: [12, 23], Sun: [12, 22] };

  function nowMsk() {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Europe/Moscow', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    }).formatToParts(new Date());
    const get = t => parts.find(p => p.type === t).value;
    return { day: get('weekday'), min: Number(get('hour')) * 60 + Number(get('minute')) };
  }

  function updateStatus() {
    const { day, min } = nowMsk();
    const [open, close] = HOURS[day] || [12, 22];
    const isOpen = min >= open * 60 && min < close * 60;
    document.querySelectorAll('[data-open-status]').forEach(el => {
      el.classList.toggle('is-open', isOpen);
      if (el.classList.contains('chip')) {
        el.textContent = isOpen ? `Открыто до ${close}:00` : `Закрыто, откроемся в ${open}:00`;
      } else {
        el.textContent = isOpen ? 'сейчас открыто' : 'сейчас закрыто';
      }
    });
  }
  updateStatus();
  setInterval(updateStatus, 60_000);
})();
