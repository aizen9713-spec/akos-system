(function (root) {
  'use strict';

  const databaseName = 'shadow-cloud-v2';
  const historyLimit = 5;
  const legacyPrefix = 'shadow-cloud-v1:backup:';
  let database;

  function open() {
    if (!database) {
      database = new Promise((resolve, reject) => {
        if (!root.indexedDB) {
          reject(new Error('IndexedDB is unavailable'));
          return;
        }
        const request = root.indexedDB.open(databaseName, 1);
        request.onupgradeneeded = () => {
          request.result.createObjectStore('connection');
          request.result.createObjectStore('history', { autoIncrement: true });
          request.result.createObjectStore('legacy');
        };
        request.onsuccess = () => {
          request.result.onversionchange = () => {
            request.result.close();
            database = undefined;
          };
          resolve(request.result);
        };
        request.onerror = () => reject(request.error);
        request.onblocked = () => reject(new Error('Close other SHADOW OS tabs to unlock storage'));
      }).catch(error => {
        database = undefined;
        throw error;
      });
    }
    return database;
  }

  async function transaction(name, mode, operation) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(name, mode, mode === 'readwrite' ? { durability: 'strict' } : undefined);
      let request;
      tx.oncomplete = () => resolve(request?.result);
      tx.onabort = () => reject(tx.error || new Error('Storage transaction aborted'));
      try {
        request = operation(tx.objectStore(name));
      } catch (error) {
        tx.abort();
        reject(error);
      }
    });
  }

  async function archiveLegacy(storage) {
    const keys = Array.from({ length: storage.length }, (_, index) => storage.key(index));
    for (const key of keys) {
      if (key !== 'shadow-cloud-v1:backup' && !key?.startsWith(legacyPrefix)) continue;
      const raw = storage.getItem(key);
      if (raw === null) continue;
      // Keep the original bytes, including any legacy record this version cannot parse.
      await transaction('legacy', 'readwrite', store => store.put(raw, key));
      if (storage.getItem(key) === raw) storage.removeItem(key);
    }
  }

  function checkpoint(local, remote) {
    return transaction('history', 'readwrite', store => {
      const keys = store.getAllKeys();
      keys.onsuccess = () => {
        for (const key of keys.result.slice(0, Math.max(0, keys.result.length - historyLimit + 1))) {
          store.delete(key);
        }
        store.add({ at: new Date().toISOString(), local, remote });
      };
    });
  }

  root.CloudStorage = {
    read: () => transaction('connection', 'readonly', store => store.get('current')),
    write: record => transaction('connection', 'readwrite', store => store.put(record, 'current')),
    clear: () => transaction('connection', 'readwrite', store => store.delete('current')),
    archiveLegacy,
    checkpoint,
    async health() {
      const [checkpoints, legacyBackups] = await Promise.all([
        transaction('history', 'readonly', store => store.count()),
        transaction('legacy', 'readonly', store => store.count())
      ]);
      return { checkpoints, historyLimit, legacyBackups };
    },
    async exportRecovery() {
      const [checkpoints, legacyBackups] = await Promise.all([
        transaction('history', 'readonly', store => store.getAll()),
        transaction('legacy', 'readonly', store => store.getAll())
      ]);
      return { format: 'shadow-cloud-recovery-v2', checkpoints, legacyBackups };
    }
  };
})(globalThis);
