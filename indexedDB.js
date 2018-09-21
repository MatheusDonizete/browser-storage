const entities = new Map();
let db = null;

const saveToEntity = e => {
  entities.set(e.name, { indexes: e.indexes, store: inMemory(e) });
};

const inMemory = store => {
  return {
    put: data => {
      const tx = db.transaction(store.name, "readwrite");
      const storeObject = tx.objectStore(store.name);
      storeObject.put(data);
      return new Promise((resolve, reject) => {
        tx.oncomplete = function() {
          resolve();
        };
      });
    },
    add: data => {
      const tx = db.transaction(store.name, "readwrite");
      const storeObject = tx.objectStore(store.name);
      storeObject.add(data);
    },
    delete: rule => {
      const tx = db.transaction(store.name, "readwrite");
      const storeObject = tx.objectStore(store.name);
      storeObject.remove(rule);
    },
    find: value => {
      return new Promise((resolve, reject) => {
        const store = db.transaction(store.name).objectStore(store.name);
        if (!!value) {
          store.get(value).onsuccess = function(event) {
            resolve(event.target.result);
          };
          return;
        }

        const data = [];
        store.openCursor().onsuccess = function(event) {
          var cursor = event.target.result;
          if (cursor) {
            data.push(cursor.value);
            cursor.continue();
          } else {
            resolve(data);
          }
        };
      });
    }
  };
};

const applyToObjectOrArray = (data, fct) => {
  if (data instanceof Array) {
    data.forEach(fct);
  } else {
    fct(data);
  }
};

const createStore = store => {
  const storeObject = db.createObjectStore(store.name, {
    keyPath: "id",
    autoIncrement: true
  });
  store.indexes.forEach(index => {
    storeObject.createIndex(`by_${index.field}`, index.field, index.options);
  });
};

const bindRequest = req => {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => {
      db = req.result;
      resolve();
    };

    req.onerror = () => reject(req.error);
  }).catch(err => console.error("Something went wrong:", err));
};

const createBrowserDB = ({ database, stores, version = 1 }) => {
  window.indexedDB =
    window.indexedDB ||
    window.mozIndexedDB ||
    window.webkitIndexedDB ||
    window.msIndexedDB;
  window.IDBTransaction = window.IDBTransaction ||
    window.webkitIDBTransaction ||
    window.msIDBTransaction || { READ_WRITE: "readwrite" }
  window.IDBKeyRange =
    window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;

  if (!window.indexedDB) {
    console.error("This browser does not support IndexedDB");
    return null;
  }
  
  const req = indexedDB.open(database, version);
  req.onupgradeneeded = () => {
    db = req.result;
    applyToObjectOrArray(stores, createStore);
    db.close();
  };

  applyToObjectOrArray(stores, saveToEntity);
  return bindRequest(req, stores).then(() => Promise.resolve(entities));
};

/**
 *
 * Usage Example:
 * createBrowserDB({ database: 'loraserver', stores: [{ name: 'frames', indexes: [{ field: 'name', options: { unique: true } }] }] })
 */

export { createBrowserDB };
