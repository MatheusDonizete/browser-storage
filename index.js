'use strict';
import * as storage from './core/localStorage';
import * as iDB from './core/indexedDB';

export const types = {
    LOCAL: new Symbol('LOCAL'),
    DB: new Symbol('INDEXED_DB')
};

const BrowserStorage = (type) => {
    const storages = new Map([
        [types.LOCAL, storage],
        [types.DB, iDB]
    ]);

    return () => {
        if (!storages.get(type)) {
            throw Error('Browser storage type not found');
        }

        return storages.get(type);
    };
} 


export default BrowserStorage;