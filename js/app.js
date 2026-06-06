import { DataStore } from './data-store.js';

const elements = {
  groupSelect: document.getElementById('groupSelect'),
  summaryContent: document.getElementById('summaryContent'),
  groupName: document.getElementById('groupName'),
  groupDescription: document.getElementById('groupDescription'),
  groupTotals: document.getElementById('groupTotals'),

  lessonCount: document.getElementById('lessonCount'),
  lessonList: document.getElementById('lessonList'),
  kanjiList: document.getElementById('kanjiList'),
  studyInfo: document.getElementById('studyInfo'),
  studyCard: document.getElementById('studyCard'),
  studyCardKanji: document.getElementById('studyCardKanji'),
  studyCardDefinition: document.getElementById('studyCardDefinition'),
  quizQuestion: document.getElementById('quizQuestion'),
  quizOptions: document.getElementById('quizOptions'),
  summaryView: document.getElementById('summaryView'),
  lessonView: document.getElementById('lessonView'),
  studyView: document.getElementById('studyView'),
  quizView: document.getElementById('quizView'),
  btnStudy: document.getElementById('btnStudy'),
  btnQuiz: document.getElementById('btnQuiz'),
  btnFlip: document.getElementById('btnFlip'),
  btnStatusLearned: document.getElementById('btnStatusLearned'),
  btnStatusReview: document.getElementById('btnStatusReview'),
  btnStatusUnlearned: document.getElementById('btnStatusUnlearned'),

  quizInfo: document.getElementById('quizInfo'),
  btnPrev: document.getElementById('btnPrev'),
  btnNext: document.getElementById('btnNext'),
  studyProgressText: document.getElementById('studyProgressText'),
  btnBackGlobal: document.getElementById('btnBackGlobal'),

};

const dataStore = new DataStore();
const state = {
  currentGroup: null,
  currentSetId: null,
  currentStudyIndex: 0,
  currentQuiz: null,
  studyStatus: {},

  
  currentQuiz: null,
  quizIndex: 0,
  quizTotal: 10, // hoặc set.items.length nếu muốn full

  quizCorrect: 0,

  studyStatus: {},

};

const STORAGE_KEYS = {
  selectedGroup: 'selected-group',
  studyStatus: 'study-status',

  lastState: 'last-state',
};

function parseStudyStatus(raw) {
  if (!raw || typeof raw !== 'object') {
    return {};
  }
  return raw;
}

function renderView(viewId) {
  [elements.summaryView, elements.lessonView, elements.studyView, elements.quizView].forEach((section) => {
    section.classList.toggle('active', section.id === viewId);
  });

   updateBackButton();

   
  // ✅ save mỗi lần chuyển view
  saveLastState(viewId);

}

function formatCount(value) {
  return new Intl.NumberFormat('vi-VN').format(value);
}

function createBadge(text) {
  const badge = document.createElement('span');
  badge.className = 'badge';
  badge.textContent = text;
  return badge;
}

function computeSetStats(set) {
  const setStatus = state.studyStatus[set.id] || {};
  const totals = { learned: 0, review: 0, unlearned: 0 };
  set.items.forEach((_, index) => {
    const status = setStatus[index] || 'unlearned';
    totals[status] += 1;
  });
  return totals;
}


function renderGroupDetails(groupName) {
  const groupInfo = dataStore.getGroupInfo(groupName);
  if (!groupInfo) {
    elements.groupName.textContent = 'Nhóm không tồn tại';
    elements.groupDescription.textContent = 'Vui lòng chọn nhóm khác.';
    elements.lessonList.innerHTML = '';

    elements.groupTotals.innerHTML = '';
    return;
  }



  renderLessonList(groupName);
}

function renderLessonList(groupName) {
  const lessons = dataStore.getLessonSets(groupName);
  elements.lessonCount.textContent = `Tổng ${lessons.length} bài học`;
  elements.lessonList.innerHTML = '';

  lessons.forEach((lesson) => {
    const set = dataStore.getSetById(lesson.id);
    const stats = computeSetStats(set);
    const item = document.createElement('li');
    item.className = 'lesson-item';
    item.dataset.lessonId = set.id;

    item.innerHTML = `
      <div class="lesson-top">
        <span class="lesson-count">${formatCount(set.totalCards)} từ</span>      
        <span class="lesson-badge">${set.lesson}</span>
      </div>
      
      <div class="lesson-meta">
        <span>✅ ${stats.learned}</span>
        <span>🔁 ${stats.review}</span>
        <span>⬜ ${stats.unlearned}</span>
      </div>
    `;

    item.addEventListener('click', () => {
      openLesson(set.id);
    });

    elements.lessonList.appendChild(item);
  });
}

function openLesson(setId) {
  state.currentSetId = setId;
  const set = dataStore.getSetById(setId);
  if (!set) {
    return;
  }

  renderLessonItems(set);
  renderView('lessonView');
}

function renderLessonItems(set) {
  elements.kanjiList.innerHTML = '';
  const stats = computeSetStats(set);
  set.items.forEach((item, index) => {
    const element = document.createElement('li');
    element.className = 'kanji-item-pro';
    const status = (state.studyStatus[set.id] || {})[index] || 'unlearned';
    element.innerHTML = `
      <div class="kanji-left">
        <div class="kanji-main">${item.kanji}</div>
      </div>

      <div class="kanji-right">
        <div class="kanji-meaning">${item.definition}</div>
        <div class="kanji-status ${status}">${status}</div>
      </div>

    `;
    elements.kanjiList.appendChild(element);
  });
}

function openStudyMode() {
  if (!state.currentSetId) {
    return;
  }
  const set = dataStore.getSetById(state.currentSetId);
  
  // ❌ bỏ reset = 0 nếu đã có
  if (state.currentStudyIndex == null) {
    state.currentStudyIndex = 0;
  }

  elements.studyInfo.textContent = `${set.lesson} · ${formatCount(set.totalCards)} từ`;
  renderStudyCard();
  renderView('studyView');
}

function renderStudyCard() {
  const set = dataStore.getSetById(state.currentSetId);
  if (!set) {
    return;
  }
  const item = set.items[state.currentStudyIndex];
  if (!item) {
    return;
  }

  elements.studyCard.classList.remove('flipped');
  elements.studyCardKanji.textContent = item.kanji;
  elements.studyCardDefinition.textContent = item.definition;

  
  // ✅ THÊM: progress text
  elements.studyProgressText.textContent =
    `${state.currentStudyIndex + 1} / ${set.items.length}`


  updateNavButtons();
}
function updateNavButtons() {
  const set = dataStore.getSetById(state.currentSetId);
  if (!set) return;

  elements.btnPrev.disabled = state.currentStudyIndex === 0;
  elements.btnNext.disabled = state.currentStudyIndex === set.items.length - 1;
}


function updateStudyStatus(status) {
  const set = dataStore.getSetById(state.currentSetId);
  if (!set) {
    return;
  }

  if (!state.studyStatus[set.id]) {
    state.studyStatus[set.id] = {};
  }

  state.studyStatus[set.id][state.currentStudyIndex] = status;
  saveState(STORAGE_KEYS.studyStatus, state.studyStatus);

  renderLessonDetailsIfActive(set.id);
  state.currentStudyIndex = (state.currentStudyIndex + 1) % set.items.length;
  renderStudyCard();
}

function renderLessonDetailsIfActive(setId) {
  if (elements.lessonView.classList.contains('active') && state.currentSetId === setId) {
    renderLessonItems(dataStore.getSetById(setId));
  }
  if (elements.summaryView.classList.contains('active')) {
    renderGroupDetails(state.currentGroup);
  }
}

function flipCard() {
  elements.studyCard.classList.toggle('flipped');
}

function nextStudyCard() {
  const set = dataStore.getSetById(state.currentSetId);
  if (!set) {
    return;
  }
  state.currentStudyIndex = (state.currentStudyIndex + 1) % set.items.length;
  renderStudyCard();
}
function prevStudyCard() {
  const set = dataStore.getSetById(state.currentSetId);
  if (!set) return;

  state.currentStudyIndex =
    (state.currentStudyIndex - 1 + set.items.length) % set.items.length;

  renderStudyCard();
}

function skipStudyCard() {
  nextStudyCard();
}

function openQuizMode() {
  if (!state.currentSetId) return;

  const set = dataStore.getSetById(state.currentSetId);
  state.quizTotal = set.items.length;

  // ❗ chỉ reset nếu chưa có dữ liệu
  if (state.quizIndex == null) state.quizIndex = 0;
  if (state.quizCorrect == null) state.quizCorrect = 0;

  prepareQuizQuestion();
  updateQuizProgress();

  renderView('quizView');
}

function updateQuizProgress() {
  const el = document.getElementById('quizProgress');
  if (!el) return;

  el.textContent = `${state.quizIndex + 1} / ${state.quizTotal} · ✅ ${state.quizCorrect}`;
}

function prepareQuizQuestion() {
  const set = dataStore.getSetById(state.currentSetId);
  if (!set) {
    return;
  }
  
  set.items = set.items.map((item, index) => ({
    ...item,
    id: item.id || `${set.id}-${index}`
  }));

  const groupItems = dataStore
  .getGroupSets(set.group)
  .flatMap(setItem =>
    setItem.items.map((item, index) => ({
      ...item,
      id: item.id || `${setItem.id}-${index}`
    }))
  );
  const shuffledSet = shuffleArray([...set.items]);
  const questionItem = shuffledSet[Math.floor(Math.random() * shuffledSet.length)];
  const otherOptions = groupItems
    .filter((item) => item.definition !== questionItem.definition)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);
    //.map((item) => item.definition);

  const options = shuffleArray([questionItem, ...otherOptions]);
  state.currentQuiz = {
    setId: set.id,
    lesson: set.lesson,
    group: set.group,
    kanji: questionItem.kanji,
    correct: questionItem.definition,
    correctId: questionItem.id,
    options,
  };

  renderQuizQuestion();
}

function renderQuizQuestion() {
  if (!state.currentQuiz) {
    return;
  }

  elements.quizQuestion.textContent = `${state.currentQuiz.kanji}`;
  elements.quizOptions.innerHTML = '';
  const labels = ['A', 'B', 'C', 'D'];

  state.currentQuiz.options.forEach((optionText, index) => {
    const option = document.createElement('button');
    option.type = 'button';
    option.className = 'quiz-option pro';
    option.dataset.id = optionText.id;
    option.innerHTML = `
      <div class="option-left">
        <span class="option-label">${labels[index]}</span>
      </div>
      <div class="option-text">${optionText.definition}</div>
      <div class="option-icon"></div>
    `;
//console.log('Render option:', optionText.definition, 'Correct:', state.currentQuiz.correct);
    option.addEventListener('click', () => handleQuizAnswer(optionText.id, option));
    elements.quizOptions.appendChild(option);
  });

  elements.quizInfo.textContent = `${state.currentQuiz.lesson} · Nhóm ${state.currentQuiz.group}`;
}

function handleQuizAnswer(selectedId, buttonElement) {
  if (!state.currentQuiz) return;

  const correctId = state.currentQuiz.correctId;

  const isCorrect = String(selectedId) === String(correctId);

  if (isCorrect) state.quizCorrect++;

  Array.from(elements.quizOptions.children).forEach(el => {
    el.disabled = true;

    const id = el.dataset.id;

    // ✅ đúng
    if (id === correctId) {
      el.classList.add('correct');
      el.querySelector('.option-icon').innerHTML = '✅';
    }

    // ✅ sai (user chọn)
    if (id === selectedId && !isCorrect) {
      el.classList.add('incorrect');
      el.querySelector('.option-icon').innerHTML = '❌';
    }

    // ✅ dim
    if (id !== correctId && id !== selectedId) {
      el.classList.add('dim');
    }
  });

  state.quizIndex++;

  setTimeout(() => {
    if (state.quizIndex >= state.quizTotal) {
      alert(`🎯 ${state.quizCorrect}/${state.quizTotal}`);
      renderView('lessonView');
      return;
    }

    prepareQuizQuestion();
    updateQuizProgress();

  }, 1200);
}


function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

async function loadState() {
  const selectedGroup = (await dataStore.getSavedObject(STORAGE_KEYS.selectedGroup)) || null;
  const savedStudy = await dataStore.getSavedObject(STORAGE_KEYS.studyStatus);
  state.studyStatus = parseStudyStatus(savedStudy);
  state.currentGroup = selectedGroup;
}

async function saveState(key, payload) {
  await dataStore.saveObject(key, payload);
}

function enrichDataWithIds() {
  dataStore.getAllSets().forEach(set => {
    set.items.forEach((item, index) => {
      if (!item.id) {
        item.id = `${set.id}-${index}`;
      }
    });
  });
}

async function initializeApp() {
  try {
    await dataStore.init();
    enrichDataWithIds();
    await loadState();

    const lastState = await dataStore.getSavedObject(STORAGE_KEYS.lastState);

    populateGroupOptions();
    if (!state.currentGroup) {
      state.currentGroup = dataStore.getGroupNames()[0] || null;
    }
    elements.groupSelect.value = state.currentGroup;
    renderGroupDetails(state.currentGroup);
    
    // ✅ restore
    if (lastState) {
      restoreLastState(lastState);
    } else {
      renderView('summaryView');
    }

    registerEvents();
    //registerServiceWorker();
  } catch (error) {
    console.error(error);
    alert('Không thể khởi tạo ứng dụng. Vui lòng kiểm tra kết nối hoặc dữ liệu JSON.');
  }
}

function populateGroupOptions() {
  const groups = dataStore.getGroupNames();
  elements.groupSelect.innerHTML = '';
  groups.forEach((groupName) => {
    const option = document.createElement('option');
    option.value = groupName;
    option.textContent = groupName;
    elements.groupSelect.appendChild(option);
  });
}

function registerEvents() {
  elements.groupSelect.addEventListener('change', async (event) => {
    state.currentGroup = event.target.value;
    await saveState(STORAGE_KEYS.selectedGroup, state.currentGroup);
    renderGroupDetails(state.currentGroup);
    renderView('summaryView');
  });

  elements.btnStudy.addEventListener('click', openStudyMode);
  elements.btnQuiz.addEventListener('click', openQuizMode);
  elements.btnFlip.addEventListener('click', flipCard);
  elements.btnStatusLearned.addEventListener('click', () => updateStudyStatus('learned'));
  elements.btnStatusReview.addEventListener('click', () => updateStudyStatus('review'));
  elements.btnStatusUnlearned.addEventListener('click', () => updateStudyStatus('unlearned'));

  elements.studyCard.addEventListener('click', flipCard);
  elements.studyCard.addEventListener('dblclick', () => {
    skipStudyCard();
    renderStudyCard();
  });
  elements.btnNext.addEventListener('click', nextStudyCard);
  elements.btnPrev.addEventListener('click', prevStudyCard);
  elements.btnBackGlobal.addEventListener('click', handleGlobalBack);

}

function toggleSummaryView() {
  const collapsed = elements.summaryContent.classList.toggle('collapsed');
  elements.toggleSummary.textContent = collapsed ? '📊' : '✖️';
  elements.toggleSummary.setAttribute('aria-label', collapsed ? 'Mở tóm tắt nhóm' : 'Đóng tóm tắt nhóm');
}

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch((error) => {
      console.warn('Service Worker không thể đăng ký:', error);
    });
  }
}
function handleGlobalBack() {
  if (elements.studyView.classList.contains('active')) {
    renderView('lessonView');
    return;
  }

  if (elements.quizView.classList.contains('active')) {
    renderView('lessonView');
    return;
  }

  if (elements.lessonView.classList.contains('active')) {
    renderView('summaryView');
    return;
  }

  // nếu đang ở summary thì không làm gì
}

function updateBackButton() {
  const isSummary = elements.summaryView.classList.contains('active');
  elements.btnBackGlobal.style.display = isSummary ? 'none' : 'flex';
}

async function saveLastState(viewId) {
  const payload = {
    view: viewId,
    setId: state.currentSetId,
    studyIndex: state.currentStudyIndex,
    quizIndex: state.quizIndex,
    quizCorrect: state.quizCorrect
  };

  await saveState(STORAGE_KEYS.lastState, payload);
}
function restoreLastState(saved) {
  state.currentSetId = saved.setId;

  if (saved.view === 'lessonView') {
    openLesson(saved.setId);
    return;
  }

  if (saved.view === 'studyView') {
    state.currentStudyIndex = saved.studyIndex || 0;
    openStudyMode();
    return;
  }

  if (saved.view === 'quizView') {
    state.quizIndex = saved.quizIndex || 0;
    state.quizCorrect = saved.quizCorrect || 0;

    openQuizMode();
    return;
  }

  renderView('summaryView');
}

initializeApp();
