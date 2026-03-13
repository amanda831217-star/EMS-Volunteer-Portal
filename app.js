const GAS_URL = 'https://script.google.com/macros/s/AKfycbxQuxRMoSik7_AfrCJqeL6fMlzKOe4ISFWzkZiwvPhXhDebaQR68tEcoDmR3_k_H9Yn1w/exec';

const state = {
  banners: [],
  notices: [],
  events: [],
  calendarYear: null,
  calendarMonth: null,
  expandedTraining: {},
  expandedSummary: {}
};

const demoData = {
  banners: [
    {
      id: 'B001',
      title: '救護義消團隊',
      imageUrl: 'images/team.jpg',
      caption: '團結、支援、守護，每一次出勤都是彼此信任的展現。',
      active: true,
      sort: 1
    }
  ],
  notices: [],
  events: []
};

function escapeHtml(v = '') {
  return String(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function linkHtml(url, text = '活動連結') {
  if (!url) return '';
  const safe = escapeHtml(url);
  return `<a class="inline-link" href="${safe}" target="_blank" rel="noopener">${escapeHtml(text)}</a>`;
}

function formatDateText(dateText) {
  const d = new Date(dateText + 'T00:00:00');
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function formatDateTextFull(dateText) {
  const d = new Date(dateText + 'T00:00:00');
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
}

function isSameDate(a, b) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth() === b.getMonth() &&
         a.getDate() === b.getDate();
}

function getToday() {
  return new Date();
}

function getActiveBanner() {
  return (state.banners || []).find(x => x.active !== false) || null;
}

function getTrainingEvents() {
  return state.events.filter(e => e.type === '大隊定訓' || e.type === '分隊定訓');
}

function getMonthEvents(year, month) {
  return state.events.filter(e => {
    const d = new Date(e.date + 'T00:00:00');
    return d.getFullYear() === year && d.getMonth() === month;
  });
}

function getThreeMonthRange() {
  const now = getToday();
  const start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function getRecentThreeMonthEvents() {
  const { start, end } = getThreeMonthRange();
  return state.events.filter(e => {
    const d = new Date(e.date + 'T00:00:00');
    return d >= start && d <= end;
  });
}

function getRecentThreeMonthTrainingEvents() {
  return getRecentThreeMonthEvents().filter(e => e.type === '大隊定訓' || e.type === '分隊定訓');
}

function getMonthTrainingEvents(year, month) {
  return getTrainingEvents().filter(e => {
    const d = new Date(e.date + 'T00:00:00');
    return d.getFullYear() === year && d.getMonth() === month;
  });
}

function getEventSummary(event) {
  const members = event.members || [];
  const joinList = members.filter(m => m.status === '參加');
  const absentList = members.filter(m => m.status === '無法參加');
  const pendingList = members.filter(m => !m.status);

  return {
    joined: joinList.length,
    absent: absentList.length,
    pending: pendingList.length,
    meat: joinList.filter(m => m.meal === '葷食').length,
    veg: joinList.filter(m => m.meal === '素食').length,
    joinList,
    absentList,
    pendingList
  };
}

function updateStats() {
  const now = getToday();
  const year = state.calendarYear ?? now.getFullYear();
  const month = state.calendarMonth ?? now.getMonth();

  const monthEvents = getMonthEvents(year, month);
  const threeMonthTraining = getRecentThreeMonthTrainingEvents();
  const totalEvents = state.events.length;

  let replies = 0;
  let meat = 0;
  let veg = 0;

  threeMonthTraining.forEach(event => {
    (event.members || []).forEach(member => {
      if (member.status) replies += 1;
      if (member.meal === '葷食') meat += 1;
      if (member.meal === '素食') veg += 1;
    });
  });

  const statEvents = document.getElementById('statEvents');
  const statTotalEvents = document.getElementById('statTotalEvents');
  const statReplies = document.getElementById('statReplies');
  const statMeat = document.getElementById('statMeat');
  const statVeg = document.getElementById('statVeg');

  if (statEvents) statEvents.textContent = monthEvents.length;
  if (statTotalEvents) statTotalEvents.textContent = totalEvents;
  if (statReplies) statReplies.textContent = replies;
  if (statMeat) statMeat.textContent = meat;
  if (statVeg) statVeg.textContent = veg;
}

function renderHeroBanner() {
  const el = document.getElementById('bannerArea');
  if (!el) return;

  const banner = getActiveBanner();

  if (!banner) {
    el.innerHTML = `
      <div class="hero-photo-card">
        <img class="hero-photo-img" src="images/team.jpg" alt="救護義消團隊">
        <div class="hero-photo-overlay"></div>
        <div class="hero-photo-text">
          <div class="hero-photo-title">救護義消團隊</div>
          <div class="hero-photo-sub">團結、支援、守護，每一次出勤都是彼此信任的展現。</div>
        </div>
      </div>
    `;
    return;
  }

  el.innerHTML = `
    <div class="hero-photo-card">
      <img class="hero-photo-img" src="${escapeHtml(banner.imageUrl || 'images/team.jpg')}" alt="${escapeHtml(banner.title || '救護義消團隊')}">
      <div class="hero-photo-overlay"></div>
      <div class="hero-photo-text">
        <div class="hero-photo-title">${escapeHtml(banner.title || '救護義消團隊')}</div>
        <div class="hero-photo-sub">${escapeHtml(banner.caption || '團結、支援、守護，每一次出勤都是彼此信任的展現。')}</div>
      </div>
    </div>
  `;
}

function renderNotices() {
  const el = document.getElementById('noticeArea');
  if (!el) return;

  const html = state.notices
    .slice()
    .sort((a, b) => Number(a.sort || 9999) - Number(b.sort || 9999))
    .map(item => `
      <div class="notice-card">
        <div class="notice-title">${escapeHtml(item.title)}</div>
        <div class="notice-body">${escapeHtml(item.body)}</div>
        ${linkHtml(item.link, '查看通知')}
      </div>
    `)
    .join('');

  el.innerHTML = html || `
    <div class="notice-card">
      <div class="notice-title">目前無公告</div>
      <div class="notice-body">尚未新增公告資料。</div>
    </div>
  `;
}

function gotoTrainingEvent(eventId) {
  const navBtns = document.querySelectorAll('.nav-btn');
  const panels = document.querySelectorAll('.panel');

  navBtns.forEach(x => x.classList.remove('active'));
  panels.forEach(x => x.classList.remove('active'));

  const trainingBtn = document.querySelector('.nav-btn[data-panel="training"]');
  const trainingPanel = document.getElementById('panel-training');

  if (trainingBtn) trainingBtn.classList.add('active');
  if (trainingPanel) trainingPanel.classList.add('active');

  state.expandedTraining[eventId] = true;
  renderTraining();

  setTimeout(() => {
    const card = document.getElementById(`training-card-${eventId}`);
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, 50);
}

function bindHomeEventCards() {
  document.querySelectorAll('[data-jump-training]').forEach(card => {
    card.addEventListener('click', () => {
      const eventId = card.dataset.jumpTraining;
      gotoTrainingEvent(eventId);
    });
  });
}

function renderHomeEvents() {
  const el = document.getElementById('homeEventList');
  if (!el) return;

  const html = state.events
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date) || Number(a.sort || 9999) - Number(b.sort || 9999))
    .map(item => {
      const isTraining = item.type === '大隊定訓' || item.type === '分隊定訓';
      return `
        <div class="event-mobile-card ${isTraining ? 'is-link' : ''}" ${isTraining ? `data-jump-training="${escapeHtml(item.id)}"` : ''}>
          <div class="event-mobile-top">
            <div class="event-mobile-title">${escapeHtml(item.title)}</div>
            <div class="event-mobile-type ${item.type === '大隊定訓' ? 'event-type-command' : item.type === '分隊定訓' ? 'event-type-unit' : 'event-type-other'}">
              ${escapeHtml(item.type)}
            </div>
          </div>
          <div class="event-mobile-meta">${formatDateText(item.date)}｜${escapeHtml(item.location || '')}</div>
          <div class="muted">${escapeHtml(item.message || '')}</div>
          <div class="event-mobile-footer">
            ${linkHtml(item.link)}
            ${isTraining ? '<div class="event-mobile-linkhint">點擊前往回覆 ↗</div>' : ''}
          </div>
        </div>
      `;
    })
    .join('');

  el.innerHTML = html || `
    <div class="event-mobile-card">
      <div class="event-mobile-title">目前無活動</div>
      <div class="muted">請至後台新增活動。</div>
    </div>
  `;

  bindHomeEventCards();
}

function renderSummaryDetails(event, summary, isOpen) {
  return `
    <div class="summary-detail-wrap ${isOpen ? 'open' : ''}" id="summary-detail-${escapeHtml(event.id)}">
      <div class="summary-group">
        <div class="summary-group-title">參加名單</div>
        <div class="summary-name-list">
          ${summary.joinList.length ? summary.joinList.map(m => `
            <div class="summary-name-item">
              <div class="summary-name">${escapeHtml(m.name)}</div>
              <div class="summary-meal">${escapeHtml(m.meal || '未選便當')}</div>
            </div>
          `).join('') : '<div class="muted">尚無參加名單</div>'}
        </div>
      </div>

      <div class="summary-group">
        <div class="summary-group-title">無法參加名單</div>
        <div class="summary-name-list">
          ${summary.absentList.length ? summary.absentList.map(m => `
            <div class="summary-name-item">
              <div class="summary-name">${escapeHtml(m.name)}</div>
              <div class="summary-status-chip summary-status-absent">無法參加</div>
            </div>
          `).join('') : '<div class="muted">尚無無法參加名單</div>'}
        </div>
      </div>

      <div class="summary-group">
        <div class="summary-group-title">未回覆名單</div>
        <div class="summary-name-list">
          ${summary.pendingList.length ? summary.pendingList.map(m => `
            <div class="summary-name-item">
              <div class="summary-name">${escapeHtml(m.name)}</div>
              <div class="summary-status-chip summary-status-pending">未回覆</div>
            </div>
          `).join('') : '<div class="muted">全部已回覆</div>'}
        </div>
      </div>
    </div>
  `;
}

function bindSummaryToggleButtons() {
  document.querySelectorAll('[data-toggle-summary]').forEach(btn => {
    btn.addEventListener('click', () => {
      const eventId = btn.dataset.toggleSummary;
      state.expandedSummary[eventId] = !state.expandedSummary[eventId];
      renderHomeSummary();
    });
  });
}

function renderHomeSummary() {
  const el = document.getElementById('summaryArea');
  if (!el) return;

  const events = getRecentThreeMonthTrainingEvents()
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date) || Number(a.sort || 9999) - Number(b.sort || 9999));

  if (!events.length) {
    el.innerHTML = `
      <div class="summary-card">
        <div class="summary-card-title">近三個月無定訓活動</div>
        <div class="muted">目前沒有可統整的定訓資料。</div>
      </div>
    `;
    return;
  }

  el.innerHTML = events.map(event => {
    const summary = getEventSummary(event);
    const isOpen = !!state.expandedSummary[event.id];

    return `
      <div class="summary-card">
        <div class="summary-card-top">
          <div>
            <div class="summary-card-title">${escapeHtml(event.title)}</div>
            <div class="summary-card-meta">${formatDateTextFull(event.date)}｜${escapeHtml(event.type)}｜${escapeHtml(event.location || '')}</div>
          </div>
          <span class="tag tag-purple">近三月</span>
        </div>

        <div class="summary-badges">
          <div class="summary-badge">參加 ${summary.joined}</div>
          <div class="summary-badge">無法參加 ${summary.absent}</div>
          <div class="summary-badge">未回覆 ${summary.pending}</div>
          <div class="summary-badge">葷食 ${summary.meat}</div>
          <div class="summary-badge">素食 ${summary.veg}</div>
        </div>

        <div class="summary-toggle-wrap">
          <button class="toggle-btn" type="button" data-toggle-summary="${escapeHtml(event.id)}">
            ${isOpen ? '收起名單 ▲' : '展開名單 ▼'}
          </button>
        </div>

        ${renderSummaryDetails(event, summary, isOpen)}
      </div>
    `;
  }).join('');

  bindSummaryToggleButtons();
}

function bindTrainingToggleButtons() {
  document.querySelectorAll('[data-toggle-training]').forEach(btn => {
    btn.addEventListener('click', () => {
      const eventId = btn.dataset.toggleTraining;
      state.expandedTraining[eventId] = !state.expandedTraining[eventId];
      renderTraining();
    });
  });
}

function renderTraining() {
  const trainingEvents = getTrainingEvents()
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date) || Number(a.sort || 9999) - Number(b.sort || 9999));

  const countEl = document.getElementById('trainingCount');
  const areaEl = document.getElementById('trainingArea');

  if (countEl) countEl.textContent = `${trainingEvents.length} 場`;
  if (!areaEl) return;

  const html = trainingEvents.map(event => {
    const summary = getEventSummary(event);
    const isExpanded = !!state.expandedTraining[event.id];

    return `
      <div class="training-card" id="training-card-${escapeHtml(event.id)}">
        <div class="training-head">
          <div class="training-head-left">
            <div class="training-title">${escapeHtml(event.title)}</div>
            <div class="training-meta">${formatDateText(event.date)}｜${escapeHtml(event.type)}｜${escapeHtml(event.location || '')}</div>
            <div class="muted">${escapeHtml(event.message || '')}</div>
            ${linkHtml(event.link)}
          </div>

          <div class="training-head-right">
            <span class="tag tag-blue">${summary.joined} 人參加</span>
            <button class="toggle-btn" type="button" data-toggle-training="${escapeHtml(event.id)}">
              ${isExpanded ? '收起名單 ▲' : '展開名單 ▼'}
            </button>
          </div>
        </div>

        <div class="summary-strip">
          <div class="summary-chip">參加 ${summary.joined} 人</div>
          <div class="summary-chip">無法參加 ${summary.absent} 人</div>
          <div class="summary-chip">未回覆 ${summary.pending} 人</div>
          <div class="summary-chip">葷食 ${summary.meat} 份</div>
          <div class="summary-chip">素食 ${summary.veg} 份</div>
        </div>

        <div class="member-container" id="members-${escapeHtml(event.id)}" style="display:${isExpanded ? 'block' : 'none'}">
          ${(event.members || []).map((member, idx) => `
            <div class="member-row">
              <div class="member-left">
                <div class="member-name">${escapeHtml(member.name)}</div>
                <div class="member-sub">${member.status ? escapeHtml(member.status) : '尚未回覆'}</div>
              </div>

              <div class="member-right">
                <div class="btn-row">
                  <button class="action-btn join ${member.status === '參加' ? 'active' : ''}" data-event="${escapeHtml(event.id)}" data-member="${idx}" data-status="參加">參加</button>
                  <button class="action-btn absent ${member.status === '無法參加' ? 'active' : ''}" data-event="${escapeHtml(event.id)}" data-member="${idx}" data-status="無法參加">無法參加</button>
                </div>

                <div class="btn-row">
                  <button class="action-btn meat ${member.meal === '葷食' ? 'active' : ''}" ${member.status === '無法參加' || !member.status ? 'disabled' : ''} data-event="${escapeHtml(event.id)}" data-member="${idx}" data-meal="葷食">葷食</button>
                  <button class="action-btn veg ${member.meal === '素食' ? 'active' : ''}" ${member.status === '無法參加' || !member.status ? 'disabled' : ''} data-event="${escapeHtml(event.id)}" data-member="${idx}" data-meal="素食">素食</button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');

  areaEl.innerHTML = html || `
    <div class="training-card">
      <div class="training-title">目前沒有定訓活動</div>
      <div class="muted">請至後台新增大隊定訓或分隊定訓。</div>
    </div>
  `;

  bindTrainingButtons();
  bindTrainingToggleButtons();
}

function buildMonthEventsMap(year, month) {
  const map = {};
  state.events.forEach(event => {
    const dt = new Date(event.date + 'T00:00:00');
    if (dt.getFullYear() === year && dt.getMonth() === month) {
      const day = dt.getDate();
      if (!map[day]) map[day] = [];
      map[day].push(event);
    }
  });
  return map;
}

function renderCalendar() {
  const gridEl = document.getElementById('calendarArea');
  const monthListEl = document.getElementById('monthList');
  const titleEl = document.getElementById('calendarTitle');
  const monthEventCountEl = document.getElementById('calendarMonthEventCount');
  const monthTrainingCountEl = document.getElementById('calendarMonthTrainingCount');

  if (!gridEl || !monthListEl || !titleEl) return;

  const now = getToday();

  if (state.calendarYear === null || state.calendarMonth === null) {
    if (state.events[0]) {
      const d = new Date(state.events[0].date + 'T00:00:00');
      state.calendarYear = d.getFullYear();
      state.calendarMonth = d.getMonth();
    } else {
      state.calendarYear = now.getFullYear();
      state.calendarMonth = now.getMonth();
    }
  }

  const year = state.calendarYear;
  const month = state.calendarMonth;
  const monthEvents = getMonthEvents(year, month);
  const monthTrainings = getMonthTrainingEvents(year, month);

  titleEl.textContent = `${year} / ${String(month + 1).padStart(2, '0')}`;
  if (monthEventCountEl) monthEventCountEl.textContent = monthEvents.length;
  if (monthTrainingCountEl) monthTrainingCountEl.textContent = monthTrainings.length;

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const eventMap = buildMonthEventsMap(year, month);

  const html = [];

  for (let i = 0; i < firstDay; i++) {
    html.push('<div class="day-cell empty"></div>');
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const items = (eventMap[day] || [])
      .slice()
      .sort((a, b) => Number(a.sort || 9999) - Number(b.sort || 9999));

    const cellDate = new Date(year, month, day);
    const today = isSameDate(cellDate, now);
    const hasEvents = items.length > 0;

    html.push(`
      <div class="day-cell ${hasEvents ? 'has-events' : ''} ${today ? 'today' : ''}">
        <div class="day-top">
          <div class="day-num">${day}</div>
          <div class="day-dot ${hasEvents ? 'has-event' : ''}"></div>
        </div>
        <div class="day-events">
          ${items.slice(0, 3).map(item => `
            <div class="day-pill ${item.type === '大隊定訓' ? 'command' : item.type === '分隊定訓' ? 'unit' : 'other'}">
              ${escapeHtml(item.title)}
            </div>
          `).join('')}
        </div>
      </div>
    `);
  }

  gridEl.innerHTML = html.join('');

  monthListEl.innerHTML = monthEvents.length
    ? monthEvents
        .slice()
        .sort((a, b) => a.date.localeCompare(b.date) || Number(a.sort || 9999) - Number(b.sort || 9999))
        .map(item => `
          <div class="list-card">
            <div class="notice-title">${formatDateText(item.date)}｜${escapeHtml(item.title)}</div>
            <div class="notice-body">${escapeHtml(item.type)}｜${escapeHtml(item.location || '')}</div>
            <div class="muted">${escapeHtml(item.message || '')}</div>
            ${linkHtml(item.link)}
          </div>
        `).join('')
    : `<div class="list-card"><div class="notice-title">本月無活動</div><div class="notice-body">目前沒有排定活動資料。</div></div>`;

  updateStats();
  renderHomeSummary();
}

function rerenderAll() {
  renderHeroBanner();
  renderNotices();
  renderHomeEvents();
  renderTraining();
  renderCalendar();
}

function setupNav() {
  const navBtns = document.querySelectorAll('.nav-btn');
  const panels = document.querySelectorAll('.panel');

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      navBtns.forEach(x => x.classList.remove('active'));
      panels.forEach(x => x.classList.remove('active'));
      btn.classList.add('active');

      const target = document.getElementById(`panel-${btn.dataset.panel}`);
      if (target) target.classList.add('active');

      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}

function setupCalendarNav() {
  const prevBtn = document.getElementById('prevMonthBtn');
  const nextBtn = document.getElementById('nextMonthBtn');

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      state.calendarMonth -= 1;
      if (state.calendarMonth < 0) {
        state.calendarMonth = 11;
        state.calendarYear -= 1;
      }
      renderCalendar();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      state.calendarMonth += 1;
      if (state.calendarMonth > 11) {
        state.calendarMonth = 0;
        state.calendarYear += 1;
      }
      renderCalendar();
    });
  }
}

function bindTrainingButtons() {
  document.querySelectorAll('[data-status]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const eventId = btn.dataset.event;
      const memberIndex = Number(btn.dataset.member);
      const status = btn.dataset.status;

      const event = state.events.find(e => e.id === eventId);
      if (!event || !event.members || !event.members[memberIndex]) return;

      const member = event.members[memberIndex];
      member.status = status;

      if (status === '無法參加') {
        member.meal = '';
      } else if (!member.meal) {
        member.meal = '葷食';
      }

      renderTraining();
      renderCalendar();
      await saveResponse(eventId, member.name, member.status, member.meal);
    });
  });

  document.querySelectorAll('[data-meal]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const eventId = btn.dataset.event;
      const memberIndex = Number(btn.dataset.member);
      const meal = btn.dataset.meal;

      const event = state.events.find(e => e.id === eventId);
      if (!event || !event.members || !event.members[memberIndex]) return;

      const member = event.members[memberIndex];
      if (member.status !== '參加') return;

      member.meal = meal;

      renderTraining();
      renderCalendar();
      await saveResponse(eventId, member.name, member.status, member.meal);
    });
  });
}

async function saveResponse(eventId, memberName, status, meal) {
  try {
    await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'saveResponse',
        eventId,
        memberName,
        status,
        meal
      })
    });
  } catch (err) {
    console.error(err);
  }
}

async function loadData() {
  try {
    const res = await fetch(`${GAS_URL}?action=init`);
    const data = await res.json();

    if (!data.ok) throw new Error('load failed');

    state.banners = Array.isArray(data.banners) ? data.banners : [];
    state.notices = Array.isArray(data.notices) ? data.notices : [];
    state.events = Array.isArray(data.events) ? data.events : [];

    if (state.events[0]) {
      const d = new Date(state.events[0].date + 'T00:00:00');
      state.calendarYear = d.getFullYear();
      state.calendarMonth = d.getMonth();
    }

    rerenderAll();
  } catch (err) {
    console.error(err);
    state.banners = demoData.banners;
    state.notices = demoData.notices;
    state.events = demoData.events;
    rerenderAll();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  setupNav();
  setupCalendarNav();
  loadData();
});
