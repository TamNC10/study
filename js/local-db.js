export class LocalDb {
  constructor(databaseName = 'nihongo-study-db', storeName = 'local-store') {
    this.databaseName = databaseName;
    this.storeName = storeName;
    this.db = null;
    this.useLocalStorage = !('indexedDB' in window);
  }

  async init() {
    if (this.useLocalStorage) {
      return;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.databaseName, 1);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve();
      };

      request.onerror = () => reject(new Error('Không thể mở local database'));
    });
  }

  _withStore(mode, callback) {
    if (!this.db) {
      throw new Error('Database chưa được khởi tạo');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], mode);
      const store = transaction.objectStore(this.storeName);
      const request = callback(store);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async get(key) {
    if (this.useLocalStorage) {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : null;
    }
    return this._withStore('readonly', (store) => store.get(key));
  }

  async set(key, value) {
    if (this.useLocalStorage) {
      localStorage.setItem(key, JSON.stringify(value));
      return;
    }
    return this._withStore('readwrite', (store) => store.put(value, key));
  }

  async remove(key) {
    if (this.useLocalStorage) {
      localStorage.removeItem(key);
      return;
    }
    return this._withStore('readwrite', (store) => store.delete(key));
  }
}
