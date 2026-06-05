import { LocalDb } from './local-db.js';

export class DataStore {
  constructor(options = {}) {
    this.db = new LocalDb(options.databaseName || 'nihongo-study-db', options.storeName || 'local-store');
    this.jsonUrl = options.jsonUrl || 'data/database/quizlet_db.json';
    this.data = null;
  }

  async init() {
    await this.db.init();
    const cached = await this.db.get('quizlet-data');
    if (cached) {
      this.data = cached;
    } else {
      this.data = await this.loadJson();
      await this.db.set('quizlet-data', this.data);
    }
  }

  async loadJson() {
    const response = await fetch(this.jsonUrl);
    if (!response.ok) {
      throw new Error('Không thể tải dữ liệu JSON từ ' + this.jsonUrl);
    }
    return response.json();
  }

  getGroupNames() {
    return Object.keys(this.data.groups || {}).sort((a, b) => a.localeCompare(b, 'vi'));
  }

  getGroupInfo(groupName) {
    return this.data.groups?.[groupName] || null;
  }

  getLessonSets(groupName) {
    const group = this.getGroupInfo(groupName);
    if (!group || !Array.isArray(group.sets)) {
      return [];
    }
    return [...group.sets].sort((a, b) => a.totalCards - b.totalCards || a.lesson.localeCompare(b.lesson, 'vi'));
  }

  getSetById(setId) {
    return this.data.sets.find((set) => set.id === setId) || null;
  }

  getGroupSets(groupName) {
    return this.data.sets.filter((set) => set.group === groupName);
  }

  getAllSets() {
    return this.data.sets || [];
  }

  async getSavedObject(key) {
    return this.db.get(key);
  }

  async saveObject(key, value) {
    return this.db.set(key, value);
  }
}
