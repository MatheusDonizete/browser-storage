'use strict';

const entities = {};
let db = null;

const createStore = store => {
    const storeObject = db.createObjectStore(store.name, { keyPath: 'uuid' });
    store.indexes.forEach(index => {
        storeObject.createIndex(index.name, index.field, index.options);
    });

    return storeObject;
};

const bindRequest = (req, stores) => {
    const promise = new Promise((resolve, reject) => {
        req.onsuccess = () => {
            db = req.result;
            resolve();
        };

        req.onerror = () => reject(req.error);
    }).catch(err => console.error('Something went wrong:', err));

    promise.then(() => {
        const save = e => {
            entities[e.name] = { indexes: e.indexes };
            entities[e.name].store = createStore(e);
        };
        req.onupgradeneeded = () => {
            if (stores instanceof Array) {
                stores.forEach(save);
            } else {
                save(stores);
            }
        };
    });
};

const createBrowserDB = (database, stores) => {
    const request = indexedDB.open(database);
    bindRequest(request, stores);
};

export { createBrowserDB };