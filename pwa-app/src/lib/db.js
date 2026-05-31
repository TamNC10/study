const DB_KEY = 'kanji_app_db';
const DB_VERSION_KEY = 'kanji_app_db_version';
const STUDY_STATUS_KEY = 'kanji_study_status';
const QUIZ_RESULTS_KEY = 'kanji_quiz_results';

let _db = null;

export async function loadDatabase() {
  if (_db) return _db;

  // Always fetch to check version
  const res = await fetch('/data/database/quizlet_db.json');
  const freshDb = await res.json();
  const freshVersion = freshDb.meta?.generatedAt || '';

  const cachedVersion = localStorage.getItem(DB_VERSION_KEY);
  if (cachedVersion === freshVersion) {
    const cached = localStorage.getItem(DB_KEY);
    if (cached) {
      try {
        _db = JSON.parse(cached);
        return _db;
      } catch (e) {
        // fall through to use freshDb
      }
    }
  }

  _db = freshDb;
  localStorage.setItem(DB_KEY, JSON.stringify(_db));
  localStorage.setItem(DB_VERSION_KEY, freshVersion);
  return _db;
}

export function getGroups(db) {
  return Object.keys(db.groups).map(name => ({
    name,
    ...db.groups[name]
  }));
}

export function getSetsForGroup(db, groupName) {
  const group = db.groups[groupName];
  if (!group) return [];
  return group.sets.map(s => {
    const fullSet = db.sets.find(set => set.id === s.id);
    return fullSet || s;
  });
}

export function getSetById(db, setId) {
  return db.sets.find(s => s.id === setId) || null;
}

export function getAllItemsInGroup(db, groupName) {
  const sets = getSetsForGroup(db, groupName);
  const items = [];
  for (const set of sets) {
    if (set.items) {
      items.push(...set.items);
    }
  }
  return items;
}

// Study status: { [setId_cardIndex]: 'learned' | 'review' | 'new' }
export function getStudyStatus() {
  try {
    return JSON.parse(localStorage.getItem(STUDY_STATUS_KEY) || '{}');
  } catch {
    return {};
  }
}

export function setCardStudyStatus(setId, cardIndex, status) {
  const all = getStudyStatus();
  all[`${setId}_${cardIndex}`] = status;
  localStorage.setItem(STUDY_STATUS_KEY, JSON.stringify(all));
}

export function getCardStudyStatus(setId, cardIndex) {
  const all = getStudyStatus();
  return all[`${setId}_${cardIndex}`] || 'new';
}

// Quiz results: { [setId]: { date, score, total, details: [...] } }
export function getQuizResults() {
  try {
    return JSON.parse(localStorage.getItem(QUIZ_RESULTS_KEY) || '{}');
  } catch {
    return {};
  }
}

export function saveQuizResult(setId, result) {
  const all = getQuizResults();
  if (!all[setId]) all[setId] = [];
  all[setId].push({
    date: new Date().toISOString(),
    ...result
  });
  localStorage.setItem(QUIZ_RESULTS_KEY, JSON.stringify(all));
}

export function getQuizResultsForSet(setId) {
  const all = getQuizResults();
  return all[setId] || [];
}
