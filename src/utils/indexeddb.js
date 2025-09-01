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
  const requiredStores = [
    { name: 'globalSettings', options: { keyPath: 'id' } },
    { name: 'logiccontainers', options: { keyPath: 'id' } },
    // New stores for normalized scan data with compound key [organisation, id]
    { name: 'organisations', options: { keyPath: 'id' } },
    { name: 'projects', options: { keyPath: ['organisation', 'id'], autoIncrement: false } },
    { name: 'protected_resources', options: { keyPath: ['organisation', 'resourceType', 'id'], autoIncrement: false } },
    { name: 'build_definitions', options: { keyPath: ['organisation', 'id'], autoIncrement: false } },
    { name: 'builds', options: { keyPath: ['organisation', 'id'], autoIncrement: false } },
    { name: 'stats', options: { keyPath: ['organisation', 'id'], autoIncrement: false, } },
    // Optionally keep scanresults for legacy/transition
    // { name: 'scanresults', options: { keyPath: 'id', autoIncrement: false } },
    // New stores for commits and committer_stats
    { name: 'commits', options: { keyPath: ['organisation', 'repositoryId', 'commitId'], autoIncrement: false } },
    { name: 'committer_stats', options: { keyPath: ['organisation', 'committerEmail'], autoIncrement: false } },
    { name: 'bot_accounts', options: { keyPath: ['organisation', 'id'], autoIncrement: false } },
    { name: 'repo_branches', options: { keyPath: ['organisation', 'repoId', 'objectId'], autoIncrement: false } }
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
    db.close();
  } catch {
    version = 1;
  }

  // Check for missing stores
  const openRequest2 = indexedDB.open(dbName, version);
  db = await new Promise((resolve, reject) => {
    openRequest2.onsuccess = (event) => resolve(event.target.result);
    openRequest2.onerror = (e) => reject(e.target.error);
  });
  const missingStores = requiredStores.filter(store => !db.objectStoreNames.contains(store.name));
  db.close();

  if (missingStores.length > 0) {
    // Bump version and create missing stores
    const newVersion = version + 1;
    const upgradeRequest = indexedDB.open(dbName, newVersion);
    let createdStores = missingStores.map(store => store.name);
    upgradeRequest.onupgradeneeded = (event) => {
      const db2 = event.target.result;
      for (const store of missingStores) {
        if (!db2.objectStoreNames.contains(store.name)) {
          const objectStore = db2.createObjectStore(store.name, store.options);
          // Add indexes for each store
          switch (store.name) {
            case 'organisations':
              objectStore.createIndex('byName', 'name', { unique: false });
              objectStore.createIndex('byType', 'type', { unique: false });
              break;
            case 'projects':
              objectStore.createIndex('byName', 'name', { unique: false });
              objectStore.createIndex('byState', 'state', { unique: false });
              objectStore.createIndex('byOrganisation', 'organisation', { unique: false });
              objectStore.createIndex('byKProjectId', 'k_project.id', { unique: false });
              objectStore.createIndex('byKProjectName', 'k_project.name', { unique: false });
              objectStore.createIndex('byOrgAndKProject', ['organisation', 'k_project.id'], { unique: false });
              objectStore.createIndex('byOrgAndKProjectName', ['organisation', 'k_project.name'], { unique: false });
              break;
            case 'protected_resources':
              objectStore.createIndex('byResourceType', 'resourceType', { unique: false });
              objectStore.createIndex('byOrganisation', 'organisation', { unique: false });
              objectStore.createIndex('byKProjectId', 'k_project.id', { unique: false });
              objectStore.createIndex('byKProjectName', 'k_project.name', { unique: false });
              objectStore.createIndex('byOrgAndKProject', ['organisation', 'k_project.id'], { unique: false });
              objectStore.createIndex('byOrgAndType', ['organisation', 'resourceType'], { unique: false });
              objectStore.createIndex('byOrgAndKProjectName', ['organisation', 'k_project.name'], { unique: false });
              objectStore.createIndex('byResourceTypeAndOrgAndProject', ['resourceType', 'organisation', 'project.id'], { unique: false });
              break;
            case 'build_definitions':
              objectStore.createIndex('byName', 'name', { unique: false });
              objectStore.createIndex('byProjectId', 'project.id', { unique: false });
              objectStore.createIndex('byOrganisation', 'organisation', { unique: false });
              objectStore.createIndex('byKProjectId', 'k_project.id', { unique: false });
              objectStore.createIndex('byKProjectName', 'k_project.name', { unique: false });
              objectStore.createIndex('byOrgAndKProject', ['organisation', 'k_project.id'], { unique: false });
              objectStore.createIndex('byOrgAndKProjectName', ['organisation', 'k_project.name'], { unique: false });
              break;
            case 'builds':
              objectStore.createIndex('byStatus', 'status', { unique: false });
              objectStore.createIndex('byResult', 'result', { unique: false });
              objectStore.createIndex('byProjectId', 'project.id', { unique: false });
              objectStore.createIndex('byOrganisation', 'organisation', { unique: false });
              objectStore.createIndex('byKProjectId', 'k_project.id', { unique: false });
              objectStore.createIndex('byKProjectName', 'k_project.name', { unique: false });
              objectStore.createIndex('byOrgAndKProject', ['organisation', 'k_project.id'], { unique: false });
              objectStore.createIndex('byOrgAndKProjectName', ['organisation', 'k_project.name'], { unique: false });
              break;
            case 'stats':
              objectStore.createIndex('byOrganisation', 'organisation', { unique: false });
              break;
            case 'commits':
              objectStore.createIndex('byOrganisation', 'organisation', { unique: false });
              objectStore.createIndex('byOrgAndKProject', ['organisation', 'k_project.id'], { unique: false });
              objectStore.createIndex('byOrgAndKProjectName', ['organisation', 'k_project.name'], { unique: false });
              objectStore.createIndex('byOrgAndCommitterEmail', ['organisation', 'committerEmail'], { unique: false });
              objectStore.createIndex('byOrgCommitterAuthorMatch', ['organisation', 'committerAuthorMatch'], { unique: false });
              objectStore.createIndex('byOrgCommitterPusherMatch', ['organisation', 'committerPusherMatch'], { unique: false });
              objectStore.createIndex('byOrgCommitByAdo', ['organisation', 'commitByAdo'], { unique: false });
              objectStore.createIndex('byOrgAndUserCommitterAuthorMatch', ['organisation', 'committerEmail', 'committerAuthorMatch'], { unique: false });
              objectStore.createIndex('byOrgAndUserCommitterPusherMatch', ['organisation', 'committerEmail', 'committerPusherMatch'], { unique: false });
              objectStore.createIndex('byOrgAndUserCommitByAdo', ['organisation', 'committerEmail', 'commitByAdo'], { unique: false });
              break;
            case 'bot_accounts':
              objectStore.createIndex('byOrganisation', 'organisation', { unique: false });
              objectStore.createIndex('byRemoveFromPusherEmails', 'removeFromPusherEmails', { unique: false });
              break;
            case 'committer_stats':
              objectStore.createIndex('byOrganisation', 'organisation', { unique: false });
              objectStore.createIndex('byOrgAndCommitterEmail', ['organisation', 'committerEmail'], { unique: false });
              // Index does not support a contains lookup only exact match.
              // objectStore.createIndex('byOrgAndAuthorEmails', ['organisation', 'authorEmails'], { unique: false });
              // objectStore.createIndex('byOrgAndPusherEmails', ['organisation', 'pusherEmails'], { unique: false });
              objectStore.createIndex('byOrgAndHasMultipleAuthors', ['organisation', 'hasMultipleAuthors'], { unique: false });
              objectStore.createIndex('byOrgAndHasMultiplePushers', ['organisation', 'hasMultiplePushers'], { unique: false });
              objectStore.createIndex('byOrgAndUsesBuildServiceAccount', ['organisation', 'usesBuildServiceAccount'], { unique: false });
              objectStore.createIndex('byOrgAuthorsPushersBuildService', ['organisation', 'hasMultipleAuthors', 'hasMultiplePushers', 'usesBuildServiceAccount'], { unique: false });

              break;
            case 'repo_branches':
              objectStore.createIndex('byOrganisation', 'organisation', { unique: false });
              objectStore.createIndex('byOrgAndRepoId', ['organisation', 'repoId'], { unique: false });
              break;
            default:
              break;
          }
        }
      }
    };
    await new Promise((resolve, reject) => {
      upgradeRequest.onsuccess = () => resolve();
      upgradeRequest.onerror = (e) => reject(e.target.error);
    });
    // Populate initial data for new stores
    await initialPopulate({ dbName, createdStores });
  }
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