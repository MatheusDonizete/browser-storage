const entities = new Map();
let db = null;

class Index {
  constructor(field = "", options = {}) {
    this.field = field;
    this.options = Object.assign({}, options);
  }
}

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
      storeObject.delete(rule);
    },
    clearData: () => {
      const tx = db.transaction(store.name, "readwrite");
      const storeObject = tx.objectStore(store.name);

      return new Promise((resolve, reject) => {
        storeObject.openCursor().onsuccess = function(event) {
          const cursor = event.target.result;
          if (cursor) {
            storeObject.delete(cursor.value.id);
            cursor.continue();
          } else {
            resolve();
          }
        };
      });
    },
    find: value => {
      return new Promise((resolve, reject) => {
        const tx = db.transaction(store.name);
        const storeObject = tx.objectStore(store.name);
        if (!!value) {
          storeObject.get(value).onsuccess = function(event) {
            resolve(event.target.result);
          };
          return;
        }

        const data = [];
        storeObject.openCursor().onsuccess = function(event) {
          const cursor = event.target.result;
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
  })
  .then(() => entities)
  .catch(err => console.error("Something went wrong:", err));
};

const createBrowserDB = async ({ database, stores, version = 1 }) => {
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
  return await bindRequest(req, stores);
};

/**
 *
 * Usage Example:
 * createBrowserDB({ database: 'loraserver', stores: [{ name: 'frames', indexes: [{ field: 'name', options: { unique: true } }] }] })
 * map.get('frames').store.add({ name: 'batata', stored: true, obj: { foo: 'baz'}})
 * @return Promise<Map<{ indexes: Index[], store: { add, delete, find, put } }>>
 */

export { Index, createBrowserDB };
export default createBrowserDB;
