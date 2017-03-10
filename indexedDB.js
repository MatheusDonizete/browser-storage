'use strict';

const entities = {};
let db = null;

const saveToEntity = e => {
    entities[e.name] = { indexes: e.indexes };
    entities[e.name].store = inMemory(e);
};

const inMemory = store => {
    return {
        put: (data) => {
            const tx = db.transaction(store.name, "readwrite");
            const storeObject = tx.objectStore(store.name);
            storeObject.put(data);
            return new Promise(resolve => {
                tx.oncomplete = function() {
                    resolve();
                };
            });
        },
        find: ({ field = '', value = '' }) => {
            return field;
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
    const storeObject = db.createObjectStore(store.name, { keyPath: 'uuid' });
    store.indexes.forEach(index => {
        storeObject.createIndex(`by_${index.field}`, index.field, index.options);
    });
};

const bindRequest = (req) => {
    return new Promise((resolve, reject) => {
        req.onsuccess = () => {
            db = req.result;
            resolve();
        };

        req.onerror = () => reject(req.error);
    }).catch(err => console.error('Something went wrong:', err));
};

const createBrowserDB = ({ database, stores, version = 1 }) => {
    const req = indexedDB.open(database, version);
    req.onupgradeneeded = () => {
        db = req.result;
        applyToObjectOrArray(stores, createStore);
        db.close();
    };

    applyToObjectOrArray(stores, saveToEntity);
    return bindRequest(req, stores).then(() => Promise.resolve(entities));
};

export { createBrowserDB };