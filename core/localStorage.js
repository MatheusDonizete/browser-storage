'use strict';

import { uuidv4 } from "../utils/uuid";

let entities = new Map();

const saveAtLocal = () => {
    let guid = localStorage.getItem(`db:guid`);
    if (!guid) {
        guid = uuidv4();
        localStorage.setItem(`db:guid`, guid);
    }

    const data = JSON.stringify({
        data: Array.from(entities)
            .map(e => [e[0], Array.from(e[1])])
    });
    localStorage.setItem(`data:${guid}`, data);
};

const loadFromLocal = () => {
    const { data } = JSON.parse(localStorage.getItem(`data:${id}`));
    entities = data.map(e => {
        return [e[0], new Map(e[1])]
    });
};

const save = (entity) => (value) => {
    const instance = entities.get(entity);
    if (!instance) {
        throw Error('Entity not found');
    }
    instance.set(uuidv4, value);
    saveAtLocal();
    return instance;
};

const removeEntity = (name) => {
    entities.set(name, null);
    saveAtLocal();
    return entities;
};

const createEntity = (name) => {
    entities.set(name, new Map());
    saveAtLocal();
    return entities.get(name);
};

const getData = (name = '') =>
    !name ?
        entities :
        entities.get(name);

const initDB = () => {
    loadFromLocal();
    return entities;
};

export {
    initDB,
    getData,
    save,
    createEntity,
    removeEntity
};