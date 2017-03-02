'use strict';
let entities = {};
const saveEntity = (name) => {
    localStorage.setItem(name, JSON.stringify(entities[name]));
    return entities;
};

const removeEntity = (name) => {
    delete(entities[name]);
    localStorage.removeItem(name);
    return entities;
};

const createEntity = (name) => {
    entities[name] = {};
    saveEntity(name);
    return entities[name];
};

const getData = (name = '') => name === '' ? entities : entities[name];

export { saveEntity, createEntity, removeEntity, getData };