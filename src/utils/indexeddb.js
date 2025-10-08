/* Copyright Notice
SPDX-FileCopyrightText: 2025 Observes io LTD
SPDX-License-Identifier: LicenseRef-PolyForm-Internal-Use-1.0.0

Copyright (c) 2025 Observes io LTD, Scotland, Company No. SC864704
Licensed under PolyForm Internal Use 1.0.0, see LICENSE or https://polyformproject.org/licenses/internal-use/1.0.0
Internal use only; additional clarifications in LICENSE-CLARIFICATIONS.md
*/

import { OBSERVES_DB_NAME } from './dbConfig';
import defaultSettings from '../state/stores/defaultSettings';
import defaultLogicContainers from '../state/stores/defaultLogicContainers';

// Utility to ensure an IndexedDB object store exists before use
export function ensureObjectStore(dbName, storeName) {
  return new Promise((resolve, reject) => {
    const openRequest = indexedDB.open(dbName);
    openRequest.onsuccess = (event) => {
      const db = event.target.result;
      if (db.objectStoreNames.contains(storeName)) {
        db.close();
        resolve();
      } else {
        // Store missing, upgrade DB version to create it
        const newVersion = db.version + 1;
        db.close();
        const upgradeRequest = indexedDB.open(dbName, newVersion);
        upgradeRequest.onupgradeneeded = (event) => {
          const upgradeDb = event.target.result;
          if (!upgradeDb.objectStoreNames.contains(storeName)) {
            upgradeDb.createObjectStore(storeName, { keyPath: "id" });
            console.log(`Object store '${storeName}' created (upgrade)`);
          }
        };
        upgradeRequest.onsuccess = (event) => {
          event.target.result.close();
          resolve();
        };
        upgradeRequest.onerror = (e) => reject("DB upgrade error: " + e.target.error);
      }
    };
    openRequest.onerror = (e) => reject("DB open error: " + e.target.error);
  });
}

// Utility to get global settings in IndexedDB (assumes store exists and is initialized)
export async function getGlobalSettings({
  dbName = OBSERVES_DB_NAME,
  storeName = 'globalSettings',
  key = 'global'
} = {}) {
  return new Promise((resolve, reject) => {
    const openRequest = indexedDB.open(dbName);
    openRequest.onsuccess = (event) => {
      const db = event.target.result;
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const getRequest = store.get(key);
      getRequest.onsuccess = () => {
        db.close();
        resolve(getRequest.result);
      };
      getRequest.onerror = (e) => {
        db.close();
        reject('Failed to get global settings: ' + e.target.error);
      };
    };
    openRequest.onerror = (e) => reject('DB open error: ' + e.target.error);
  });
}

// Initial population for new stores
export async function initialPopulate({ dbName, createdStores }) {
  return new Promise((resolve, reject) => {
    const openRequest = indexedDB.open(dbName);
    openRequest.onsuccess = (event) => {
      const db = event.target.result;
      const tx = db.transaction(createdStores, 'readwrite');
      if (createdStores.includes('globalSettings')) {
        const store = tx.objectStore('globalSettings');
        store.put({ id: 'global', ...defaultSettings });
      }
      if (createdStores.includes('logiccontainers')) {
        const store = tx.objectStore('logiccontainers');
        for (const container of defaultLogicContainers) {
          store.put(container);
        }
      }
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = (e) => {
        db.close();
        reject('Failed to populate initial data: ' + e.target.error);
      };
    };
    openRequest.onerror = (e) => reject('DB open error: ' + e.target.error);
  });
}

// Robust initialization for index DB and required stores
export async function initIndexDb() {
  const dbName = OBSERVES_DB_NAME;
  // Define required stores and their required indexes
  const requiredStores = [
    { name: 'globalSettings', options: { keyPath: 'id' }, indexes: [] },
    { name: 'logiccontainers', options: { keyPath: 'id' }, indexes: [] },
    {
      name: 'organisations', options: { keyPath: 'id' }, indexes: [
        { name: 'byName', keyPath: 'name', options: { unique: false } },
        { name: 'byType', keyPath: 'type', options: { unique: false } },
      ]
    },
    {
      name: 'projects', options: { keyPath: ['organisation', 'id'], autoIncrement: false }, indexes: [
        { name: 'byName', keyPath: 'name', options: { unique: false } },
        { name: 'byState', keyPath: 'state', options: { unique: false } },
        { name: 'byOrganisation', keyPath: 'organisation', options: { unique: false } },
        { name: 'byKProjectId', keyPath: 'k_project.id', options: { unique: false } },
        { name: 'byKProjectName', keyPath: 'k_project.name', options: { unique: false } },
        { name: 'byOrgAndKProject', keyPath: ['organisation', 'k_project.id'], options: { unique: false } },
        { name: 'byOrgAndKProjectName', keyPath: ['organisation', 'k_project.name'], options: { unique: false } },
      ]
    },
    {
      name: 'protected_resources', options: { keyPath: ['organisation', 'resourceType', 'id'], autoIncrement: false }, indexes: [
        { name: 'byResourceType', keyPath: 'resourceType', options: { unique: false } },
        { name: 'byOrganisation', keyPath: 'organisation', options: { unique: false } },
        { name: 'byOrgAndResourceType', keyPath: ['organisation', 'resourceType'], options: { unique: false } },
        { name: 'byKProjectId', keyPath: 'k_project.id', options: { unique: false } },
        { name: 'byKProjectName', keyPath: 'k_project.name', options: { unique: false } },
        { name: 'byOrgAndKProject', keyPath: ['organisation', 'k_project.id'], options: { unique: false } },
        { name: 'byOrgAndType', keyPath: ['organisation', 'resourceType'], options: { unique: false } },
        { name: 'byOrgAndKProjectName', keyPath: ['organisation', 'k_project.name'], options: { unique: false } },
        { name: 'byResourceTypeAndOrgAndKProject', keyPath: ['resourceType', 'organisation', 'k_project.id'], options: { unique: false } },
      ]
    },
    {
      name: 'build_definitions', options: { keyPath: ['organisation', 'id'], autoIncrement: false }, indexes: [
        { name: 'byName', keyPath: 'name', options: { unique: false } },
        { name: 'byProjectId', keyPath: 'project.id', options: { unique: false } },
        { name: 'byOrganisation', keyPath: 'organisation', options: { unique: false } },
        { name: 'byKProjectId', keyPath: 'k_project.id', options: { unique: false } },
        { name: 'byKProjectName', keyPath: 'k_project.name', options: { unique: false } },
        { name: 'byOrgAndKProject', keyPath: ['organisation', 'k_project.id'], options: { unique: false } },
        { name: 'byOrgAndKProjectName', keyPath: ['organisation', 'k_project.name'], options: { unique: false } },
      ]
    },
    {
      name: 'build_definitions_previews', options: { keyPath: ['organisation', 'definitionId', 'branch'], autoIncrement: false }, indexes: [
        { name: 'byOrganisation', keyPath: 'organisation', options: { unique: false } },
        { name: 'byDefinitionId', keyPath: 'definitionId', options: { unique: false } },
        { name: 'byBranch', keyPath: 'branch', options: { unique: false } },
        { name: 'byOrgAndDefinitionId', keyPath: ['organisation', 'definitionId'], options: { unique: false } },
        { name: 'byOrgAndBranch', keyPath: ['organisation', 'branch'], options: { unique: false } },
        { name: 'byDefinitionIdAndBranch', keyPath: ['definitionId', 'branch'], options: { unique: false } },
        { name: 'byOrgAndDefIdAndBranch', keyPath: ['organisation', 'definitionId', 'branch'], options: { unique: false } },
        { name: 'byKProjectId', keyPath: 'k_project.id', options: { unique: false } },
        { name: 'byKProjectName', keyPath: 'k_project.name', options: { unique: false } },
        { name: 'byOrgAndKProject', keyPath: ['organisation', 'k_project.id'], options: { unique: false } },
        { name: 'byOrgAndKProjectName', keyPath: ['organisation', 'k_project.name'], options: { unique: false } },
      ]
    },
    {
      name: 'builds', options: { keyPath: ['organisation', 'id'], autoIncrement: false }, indexes: [
        { name: 'byStatus', keyPath: 'status', options: { unique: false } },
        { name: 'byResult', keyPath: 'result', options: { unique: false } },
        { name: 'byProjectId', keyPath: 'project.id', options: { unique: false } },
        { name: 'byOrganisation', keyPath: 'organisation', options: { unique: false } },
        { name: 'byKProjectId', keyPath: 'k_project.id', options: { unique: false } },
        { name: 'byKProjectName', keyPath: 'k_project.name', options: { unique: false } },
        { name: 'byOrgAndKProject', keyPath: ['organisation', 'k_project.id'], options: { unique: false } },
        { name: 'byOrgAndKProjectName', keyPath: ['organisation', 'k_project.name'], options: { unique: false } },
      ]
    },
    {
      name: 'stats', options: { keyPath: ['organisation', 'id'], autoIncrement: false }, indexes: [
        { name: 'byOrganisation', keyPath: 'organisation', options: { unique: false } },
      ]
    },
    {
      name: 'commits', options: { keyPath: ['organisation', 'repositoryId', 'commitId'], autoIncrement: false }, indexes: [
        { name: 'byOrganisation', keyPath: 'organisation', options: { unique: false } },
        { name: 'byOrgAndKProject', keyPath: ['organisation', 'k_project.id'], options: { unique: false } },
        { name: 'byOrgAndKProjectName', keyPath: ['organisation', 'k_project.name'], options: { unique: false } },
        { name: 'byOrgAndCommitterEmail', keyPath: ['organisation', 'committerEmail'], options: { unique: false } },
        { name: 'byOrgCommitterAuthorMatch', keyPath: ['organisation', 'committerAuthorMatch'], options: { unique: false } },
        { name: 'byOrgCommitterPusherMatch', keyPath: ['organisation', 'committerPusherMatch'], options: { unique: false } },
        { name: 'byOrgCommitByAdo', keyPath: ['organisation', 'commitByAdo'], options: { unique: false } },
        { name: 'byOrgAndUserCommitterAuthorMatch', keyPath: ['organisation', 'committerEmail', 'committerAuthorMatch'], options: { unique: false } },
        { name: 'byOrgAndUserCommitterPusherMatch', keyPath: ['organisation', 'committerEmail', 'committerPusherMatch'], options: { unique: false } },
        { name: 'byOrgAndUserCommitByAdo', keyPath: ['organisation', 'committerEmail', 'commitByAdo'], options: { unique: false } },
      ]
    },
    {
      name: 'committer_stats', options: { keyPath: ['organisation', 'committerEmail'], autoIncrement: false }, indexes: [
        { name: 'byOrganisation', keyPath: 'organisation', options: { unique: false } },
        { name: 'byOrgAndCommitterEmail', keyPath: ['organisation', 'committerEmail'], options: { unique: false } },
        { name: 'byOrgAndHasMultipleAuthors', keyPath: ['organisation', 'hasMultipleAuthors'], options: { unique: false } },
        { name: 'byOrgAndHasMultiplePushers', keyPath: ['organisation', 'hasMultiplePushers'], options: { unique: false } },
        { name: 'byOrgAndUsesBuildServiceAccount', keyPath: ['organisation', 'usesBuildServiceAccount'], options: { unique: false } },
        { name: 'byOrgAuthorsPushersBuildService', keyPath: ['organisation', 'hasMultipleAuthors', 'hasMultiplePushers', 'usesBuildServiceAccount'], options: { unique: false } },
      ]
    },
    {
      name: 'bot_accounts', options: { keyPath: ['organisation', 'id'], autoIncrement: false }, indexes: [
        { name: 'byOrganisation', keyPath: 'organisation', options: { unique: false } },
        { name: 'byRemoveFromPusherEmails', keyPath: 'removeFromPusherEmails', options: { unique: false } },
      ]
    },
    {
      name: 'repo_branches', options: { keyPath: ['organisation', 'repoId', 'objectId'], autoIncrement: false }, indexes: [
        { name: 'byOrganisation', keyPath: 'organisation', options: { unique: false } },
        { name: 'byOrgAndRepoId', keyPath: ['organisation', 'repoId'], options: { unique: false } },
      ]
    },
    {
      name: 'artifactsFeeds', options: { keyPath: ['organisation', 'id'], autoIncrement: false }, indexes: [
        { name: 'byProjectId', keyPath: 'project.id', options: { unique: false } },
        { name: 'byOrganisation', keyPath: 'organisation', options: { unique: false } },
        { name: 'byKProjectId', keyPath: 'k_project.id', options: { unique: false } },
        { name: 'byKProjectName', keyPath: 'k_project.name', options: { unique: false } },
        { name: 'byOrgAndKProject', keyPath: ['organisation', 'k_project.id'], options: { unique: false } },
        { name: 'byOrgAndKProjectName', keyPath: ['organisation', 'k_project.name'], options: { unique: false } },
      ]
    },
    {
      name: 'artifactsPackages', options: { keyPath: ['organisation', 'feedId', 'id'], autoIncrement: false }, indexes: [
        { name: 'byOrganisation', keyPath: 'organisation', options: { unique: false } },
        { name: 'byFeedId', keyPath: 'feedId', options: { unique: false } },
        { name: 'byId', keyPath: 'id', options: { unique: false } },
        { name: 'byOrgAndFeedId', keyPath: ['organisation', 'feedId'], options: { unique: false } },
      ]
    }
  ];

  // Open DB to check existence and current version
  let db;
  let version;
  try {
    const openRequest = indexedDB.open(dbName);
    db = await new Promise((resolve, reject) => {
      openRequest.onsuccess = (event) => resolve(event.target.result);
      openRequest.onerror = (e) => reject(e.target.error);
    });
    version = db.version;
  } catch {
    version = 1;
    db = null;
  }

  // Check for missing stores and missing indexes
  let missingStores = [];
  let missingIndexes = {};
  if (db) {
    for (const store of requiredStores) {
      if (!db.objectStoreNames.contains(store.name)) {
        missingStores.push(store);
      } else if (store.indexes && store.indexes.length > 0) {
        // Check for missing indexes
        const tx = db.transaction(store.name, 'readonly');
        const objectStore = tx.objectStore(store.name);
        const existingIndexes = Array.from(objectStore.indexNames);
        for (const idx of store.indexes) {
          if (!existingIndexes.includes(idx.name)) {
            if (!missingIndexes[store.name]) missingIndexes[store.name] = [];
            missingIndexes[store.name].push(idx);
          }
        }
      }
    }
    db.close();
  } else {
    // DB does not exist yet, all stores are missing
    missingStores = requiredStores;
  }

  const needsUpgrade = missingStores.length > 0 || Object.keys(missingIndexes).length > 0;
  if (needsUpgrade) {
    const newVersion = version + 1;
    const upgradeRequest = indexedDB.open(dbName, newVersion);
    upgradeRequest.onupgradeneeded = (event) => {
      const db2 = event.target.result;
      // Create missing stores
      for (const store of missingStores) {
        if (!db2.objectStoreNames.contains(store.name)) {
          const objectStore = db2.createObjectStore(store.name, store.options);
          if (store.indexes && store.indexes.length > 0) {
            for (const idx of store.indexes) {
              objectStore.createIndex(idx.name, idx.keyPath, idx.options);
            }
          }
        }
      }
      // Add missing indexes to existing stores
      for (const storeName in missingIndexes) {
        if (db2.objectStoreNames.contains(storeName)) {
          // Use the versionchange transaction to access existing stores
          const objectStore = event.target.transaction.objectStore(storeName);
          for (const idx of missingIndexes[storeName]) {
            if (!objectStore.indexNames.contains(idx.name)) {
              objectStore.createIndex(idx.name, idx.keyPath, idx.options);
            }
          }
        }
      }
    };
    await new Promise((resolve, reject) => {
      upgradeRequest.onsuccess = () => resolve();
      upgradeRequest.onerror = (e) => reject(e.target.error);
    });
    // Populate initial data for new stores
    const createdStores = missingStores.map(store => store.name);
    if (createdStores.length > 0) {
      await initialPopulate({ dbName, createdStores });
      if (requiredStores.length == createdStores.length) return false;
      return true;
    }
    // Only indexes were added, not stores
    return false;
  }
  return false;
}

// Generic IndexedDB helpers for CRUD operations
export async function addRecord(storeName, data) {
  return new Promise((resolve, reject) => {
    const openRequest = indexedDB.open(OBSERVES_DB_NAME);
    openRequest.onsuccess = (event) => {
      const db = event.target.result;
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(data);
      req.onsuccess = () => { db.close(); resolve(req.result); };
      req.onerror = (e) => { db.close(); reject(e.target.error); };
    };
    openRequest.onerror = (e) => reject(e.target.error);
  });
}

export async function getRecord(storeName, key) {
  return new Promise((resolve, reject) => {
    const openRequest = indexedDB.open(OBSERVES_DB_NAME);
    openRequest.onsuccess = (event) => {
      const db = event.target.result;
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(key);
      req.onsuccess = () => { db.close(); resolve(req.result); };
      req.onerror = (e) => { db.close(); reject(e.target.error); };
    };
    openRequest.onerror = (e) => reject(e.target.error);
  });
}

export async function getAllRecords(storeName, indexName, value) {
  return new Promise((resolve, reject) => {
    const openRequest = indexedDB.open(OBSERVES_DB_NAME);
    openRequest.onsuccess = (event) => {
      const db = event.target.result;
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      let req;
      if (indexName && value !== undefined) {
        const index = store.index(indexName);
        req = index.getAll(value);
      } else {
        req = store.getAll();
      }
      req.onsuccess = () => { db.close(); resolve(req.result); };
      req.onerror = (e) => { db.close(); reject(e.target.error); };
    };
    openRequest.onerror = (e) => reject(e.target.error);
  });
}

export async function deleteRecord(storeName, key) {
  return new Promise((resolve, reject) => {
    const openRequest = indexedDB.open(OBSERVES_DB_NAME);
    openRequest.onsuccess = (event) => {
      const db = event.target.result;
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(key);
      req.onsuccess = () => { db.close(); resolve(); };
      req.onerror = (e) => { db.close(); reject(e.target.error); };
    };
    openRequest.onerror = (e) => reject(e.target.error);
  });
}

export async function updateRecord(storeName, key, updateFn) {
  // updateFn: (existingRecord) => updatedRecord
  return new Promise((resolve, reject) => {
    const openRequest = indexedDB.open(OBSERVES_DB_NAME);
    openRequest.onsuccess = (event) => {
      const db = event.target.result;
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const getReq = store.get(key);
      getReq.onsuccess = () => {
        const existing = getReq.result;
        if (existing === undefined) {
          db.close();
          reject(new Error('Record not found'));
          return;
        }
        const updated = updateFn(existing);
        const putReq = store.put(updated);
        putReq.onsuccess = () => { db.close(); resolve(updated); };
        putReq.onerror = (e) => { db.close(); reject(e.target.error); };
      };
      getReq.onerror = (e) => { db.close(); reject(e.target.error); };
    };
    openRequest.onerror = (e) => reject(e.target.error);
  });
}

export async function deleteAllRecords(storeName, indexName, value) {
  return new Promise((resolve, reject) => {
    const openRequest = indexedDB.open(OBSERVES_DB_NAME);
    openRequest.onsuccess = (event) => {
      const db = event.target.result;
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      if (indexName && value !== undefined) {
        // Delete only records matching the index and value
        const index = store.index(indexName);
        const keyRange = IDBKeyRange.only(value);
        const cursorRequest = index.openCursor(keyRange);
        cursorRequest.onsuccess = (e) => {
          const cursor = e.target.result;
          if (cursor) {
            cursor.delete();
            cursor.continue();
          } else {
            db.close();
            resolve();
          }
        };
        cursorRequest.onerror = (e) => {
          db.close();
          reject(e.target.error);
        };
      } else {
        // Delete all records in the store
        const req = store.clear();
        req.onsuccess = () => { db.close(); resolve(); };
        req.onerror = (e) => { db.close(); reject(e.target.error); };
      }
    };
    openRequest.onerror = (e) => reject(e.target.error);
  });
}

export async function getCount(storeName, indexName, value) {
  return new Promise((resolve, reject) => {
    const openRequest = indexedDB.open(OBSERVES_DB_NAME);
    openRequest.onsuccess = (event) => {
      const db = event.target.result;
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      let req;
      if (indexName && value !== undefined) {
        const index = store.index(indexName);
        // Use a key range to count only matching records
        const keyRange = IDBKeyRange.only(value);
        req = index.count(keyRange);
      } else {
        req = store.count();
      }
      req.onsuccess = () => { db.close(); resolve(req.result); };
      req.onerror = (e) => { db.close(); reject(e.target.error); };
    };
    openRequest.onerror = (e) => reject(e.target.error);
  });
}

// Paginated query for IndexedDB object stores and indexes
// Usage: getPaginatedRecords(storeName, { indexName, value, offset, limit })
export async function getPaginatedRecords(storeName, { indexName, value, offset = 0, limit = 20 } = {}) {
  return new Promise((resolve, reject) => {
    const openRequest = indexedDB.open(OBSERVES_DB_NAME);
    openRequest.onsuccess = (event) => {
      const db = event.target.result;
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      let source;
      if (indexName && value !== undefined) {
        const index = store.index(indexName);
        source = index.openCursor(IDBKeyRange.only(value));
      } else {
        source = store.openCursor();
      }
      const results = [];
      let skipped = 0;
      source.onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
          if (skipped < offset) {
            skipped++;
            cursor.continue();
            return;
          }
          if (results.length < limit) {
            results.push(cursor.value);
            cursor.continue();
          } else {
            db.close();
            resolve(results);
          }
        } else {
          db.close();
          resolve(results);
        }
      };
      source.onerror = (e) => {
        db.close();
        reject(e.target.error);
      };
    };
    openRequest.onerror = (e) => reject(e.target.error);
  });
}