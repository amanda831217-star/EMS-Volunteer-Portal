const GAS_URL = 'https://script.google.com/macros/s/AKfycbxQuxRMoSik7_AfrCJqeL6fMlzKOe4ISFWzkZiwvPhXhDebaQR68tEcoDmR3_k_H9Yn1w/exec';

let adminCache = {
  banners: [],
  notices: [],
  events: [],
  members: []
};

function escapeHtml(v = '') {
  return String(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function postData(payload) {
  const res = await fetch(GAS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  });
  return await res.json();
}

async function getAdminData() {
  const res = await fetch(`${GAS_URL}?action=adminData`);
  return await res.json();
}

function resetNoticeForm() {
  document.getElementById('noticeEditId').value = '';
  document.getElementById('noticeTitle').value = '';
  document.getElementById('noticeMessage').value = '';
  document.getElementById('noticeLink').value = '';
  document.getElementById('noticeSort').value = '';
  document.getElementById('noticeFormTitle').textContent = '新增公告';
}

function resetEventForm() {
  document.getElementById('eventEditId').value = '';
  document.getElementById('eventType').value = '大隊定訓';
  document.getElementById('eventDate').value = '';
  document.getElementById('eventTitle').value = '';
  document.getElementById('eventLocation').value = '';
  document.getElementById('eventMessage').value = '';
  document.getElementById('eventLink').value = '';
  document.getElementById('eventSort').value = '';
  document.getElementById('eventFormTitle').textContent = '新增活動';
}

function resetMemberForm() {
  document.getElementById('memberEditId').value = '';
  document.getElementById('memberName').value = '';
  document.getElementById('memberFormTitle').textContent = '新增人員';
}

function renderBanners(items) {
  document.getElementById('bannerList').innerHTML = items.map(item => `
    <div class="admin-list-item">
      <div class="admin-list-title">${escapeHtml(item.title)}</div>
      <div class="admin-list-sub">${escapeHtml(item.caption || '')}</div>
      <div class="admin-list-sub">${escapeHtml(item.imageUrl || '')}</div>
      <div class="admin-list-sub">排序：${item.sort}｜啟用：${item.active ? '是' : '否'}</div>
    </div>
  `).join('');
}

function renderNotices(items) {
  document.getElementById('noticeList').innerHTML = items.map(item => `
    <div class="admin-list-item">
      <div class="admin-list-title">${escapeHtml(item.title)}</div>
      <div class="admin-list-sub">${escapeHtml(item.message || '')}</div>
      <div class="admin-list-sub">${escapeHtml(item.link || '')}</div>
      <div class="admin-list-sub">排序：${item.sort}｜啟用：${item.active ? '是' : '否'}</div>
      <div class="admin-actions">
        <button class="secondary-btn js-edit-notice" type="button" data-id="${escapeHtml(item.noticeId)}">修改</button>
        <button class="danger-btn js-delete-notice" type="button" data-id="${escapeHtml(item.noticeId)}">刪除</button>
      </div>
    </div>
  `).join('');
}

function renderEvents(items) {
  document.getElementById('eventList').innerHTML = items.map(item => `
    <div class="admin-list-item">
      <div class="admin-list-title">${escapeHtml(item.title)}</div>
      <div class="admin-list-sub">${escapeHtml(item.eventDate)}｜${escapeHtml(item.eventType)}｜${escapeHtml(item.location || '')}</div>
      <div class="admin-list-sub">${escapeHtml(item.message || '')}</div>
      <div class="admin-list-sub">${escapeHtml(item.link || '')}</div>
      <div class="admin-list-sub">排序：${item.sort}｜啟用：${item.active ? '是' : '否'}</div>
      <div class="admin-actions">
        <button class="secondary-btn js-edit-event" type="button" data-id="${escapeHtml(item.eventId)}">修改</button>
        <button class="danger-btn js-delete-event" type="button" data-id="${escapeHtml(item.eventId)}">刪除</button>
      </div>
    </div>
  `).join('');
}

function renderMembers(items) {
  document.getElementById('memberList').innerHTML = items.map(item => `
    <div class="admin-list-item">
      <div class="admin-list-title">${escapeHtml(item.memberName)}</div>
      <div class="admin-list-sub">啟用：${item.active ? '是' : '否'}</div>
      <div class="admin-actions">
        <button class="secondary-btn js-edit-member" type="button" data-id="${escapeHtml(item.memberId)}">修改</button>
        <button class="danger-btn js-delete-member" type="button" data-id="${escapeHtml(item.memberId)}">刪除</button>
      </div>
    </div>
  `).join('');
}

function bindAdminActions() {
  document.querySelectorAll('.js-edit-notice').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = adminCache.notices.find(x => x.noticeId === btn.dataset.id);
      if (!item) return;

      document.getElementById('noticeEditId').value = item.noticeId;
      document.getElementById('noticeTitle').value = item.title || '';
      document.getElementById('noticeMessage').value = item.message || '';
      document.getElementById('noticeLink').value = item.link || '';
      document.getElementById('noticeSort').value = item.sort || '';
      document.getElementById('noticeFormTitle').textContent = '修改公告';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  document.querySelectorAll('.js-delete-notice').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('確定刪除此公告？')) return;
      await postData({
        action: 'deleteNotice',
        noticeId: btn.dataset.id
      });
      await loadAdmin();
    });
  });

  document.querySelectorAll('.js-edit-event').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = adminCache.events.find(x => x.eventId === btn.dataset.id);
      if (!item) return;

      document.getElementById('eventEditId').value = item.eventId;
      document.getElementById('eventType').value = item.eventType || '大隊定訓';
      document.getElementById('eventDate').value = item.eventDate || '';
      document.getElementById('eventTitle').value = item.title || '';
      document.getElementById('eventLocation').value = item.location || '';
      document.getElementById('eventMessage').value = item.message || '';
      document.getElementById('eventLink').value = item.link || '';
      document.getElementById('eventSort').value = item.sort || '';
      document.getElementById('eventFormTitle').textContent = '修改活動';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  document.querySelectorAll('.js-delete-event').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('確定刪除此活動？')) return;
      await postData({
        action: 'deleteEvent',
        eventId: btn.dataset.id
      });
      await loadAdmin();
    });
  });

  document.querySelectorAll('.js-edit-member').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = adminCache.members.find(x => x.memberId === btn.dataset.id);
      if (!item) return;

      document.getElementById('memberEditId').value = item.memberId;
      document.getElementById('memberName').value = item.memberName || '';
      document.getElementById('memberFormTitle').textContent = '修改人員';
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    });
  });

  document.querySelectorAll('.js-delete-member').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('確定刪除此人員？')) return;
      await postData({
        action: 'deleteMember',
        memberId: btn.dataset.id
      });
      await loadAdmin();
    });
  });
}

async function loadAdmin() {
  try {
    const data = await getAdminData();
    if (!data.ok) return;

    adminCache = {
      banners: data.banners || [],
      notices: data.notices || [],
      events: data.events || [],
      members: data.members || []
    };

    renderBanners(adminCache.banners);
    renderNotices(adminCache.notices);
    renderEvents(adminCache.events);
    renderMembers(adminCache.members);
    bindAdminActions();
  } catch (err) {
    console.error(err);
    alert('後台資料載入失敗');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('saveNoticeBtn').addEventListener('click', async () => {
    const noticeId = document.getElementById('noticeEditId').value.trim();
    const title = document.getElementById('noticeTitle').value.trim();
    const message = document.getElementById('noticeMessage').value.trim();
    const link = document.getElementById('noticeLink').value.trim();
    const sort = document.getElementById('noticeSort').value.trim();

    if (!title) {
      alert('請輸入公告標題');
      return;
    }

    if (noticeId) {
      await postData({
        action: 'updateNotice',
        noticeId,
        title,
        message,
        link,
        sort,
        active: true
      });
    } else {
      await postData({
        action: 'createNotice',
        title,
        message,
        link,
        sort,
        active: true
      });
    }

    alert('公告已儲存');
    resetNoticeForm();
    await loadAdmin();
  });

  document.getElementById('saveEventBtn').addEventListener('click', async () => {
    const eventId = document.getElementById('eventEditId').value.trim();
    const eventType = document.getElementById('eventType').value;
    const eventDate = document.getElementById('eventDate').value;
    const title = document.getElementById('eventTitle').value.trim();
    const location = document.getElementById('eventLocation').value.trim();
    const message = document.getElementById('eventMessage').value.trim();
    const link = document.getElementById('eventLink').value.trim();
    const sort = document.getElementById('eventSort').value.trim();

    if (!eventType || !eventDate || !title) {
      alert('請填寫活動類型、日期、標題');
      return;
    }

    if (eventId) {
      await postData({
        action: 'updateEvent',
        eventId,
        eventType,
        eventDate,
        title,
        location,
        message,
        link,
        sort,
        active: true
      });
    } else {
      await postData({
        action: 'createEvent',
        eventType,
        eventDate,
        title,
        location,
        message,
        link,
        sort,
        active: true
      });
    }

    alert('活動已儲存');
    resetEventForm();
    await loadAdmin();
  });

  document.getElementById('saveMemberBtn').addEventListener('click', async () => {
    const memberId = document.getElementById('memberEditId').value.trim();
    const memberName = document.getElementById('memberName').value.trim();

    if (!memberName) {
      alert('請輸入人員姓名');
      return;
    }

    if (memberId) {
      await postData({
        action: 'updateMember',
        memberId,
        memberName,
        active: true
      });
    } else {
      await postData({
        action: 'createMember',
        memberName,
        active: true
      });
    }

    alert('人員已儲存');
    resetMemberForm();
    await loadAdmin();
  });

  document.getElementById('cancelNoticeBtn').addEventListener('click', resetNoticeForm);
  document.getElementById('cancelEventBtn').addEventListener('click', resetEventForm);
  document.getElementById('cancelMemberBtn').addEventListener('click', resetMemberForm);

  loadAdmin();
});
