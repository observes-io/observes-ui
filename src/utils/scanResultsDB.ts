/* Copyright Notice
SPDX-FileCopyrightText: 2025 Observes io LTD
SPDX-License-Identifier: LicenseRef-PolyForm-Internal-Use-1.0.0

Copyright (c) 2025 Observes io LTD, Scotland, Company No. SC864704
Licensed under PolyForm Internal Use 1.0.0, see LICENSE or https://polyformproject.org/licenses/internal-use/1.0.0
Internal use only; additional clarifications in LICENSE-CLARIFICATIONS.md
*/


// Utility functions for scanresults IndexedDB operations
// Usage: import { insertScanResult, updateScanResult, getScanResult, getAllScanResults, deleteScanResult } from './scanResultsDB';

import { OBSERVES_DB_NAME } from './dbConfig';

const DB_NAME = OBSERVES_DB_NAME;
const STORE_NAME = 'scanresults';

export function ensureScanResultsStore(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const openRequest = indexedDB.open(DB_NAME);
    openRequest.onupgradeneeded = function (event) {
      const db = openRequest.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    openRequest.onsuccess = function () {
      resolve(openRequest.result);
    };
    openRequest.onerror = function (e) {
      reject(e);
    };
  });
}

export async function insertScanResult(scan: any): Promise<boolean> {
  const db = await ensureScanResultsStore();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_NAME], 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.add(scan);
    req.onsuccess = () => resolve(true);
    req.onerror = (e: any) => reject(e);
  });
}

export async function updateScanResult(scan: any): Promise<boolean> {
  const db = await ensureScanResultsStore();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_NAME], 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(scan);
    req.onsuccess = () => resolve(true);
    req.onerror = (e: any) => reject(e);
  });
}

export async function getScanResult(id: string): Promise<any> {
  const db = await ensureScanResultsStore();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_NAME], 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = (e: any) => reject(e);
  });
}

export async function getAllScanResults(): Promise<any[]> {
  const db = await ensureScanResultsStore();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_NAME], 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = (e: any) => reject(e);
  });
}

export async function deleteScanResult(id: string): Promise<boolean> {
  const db = await ensureScanResultsStore();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_NAME], 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);
    req.onsuccess = () => resolve(true);
    req.onerror = (e: any) => reject(e);
  });
}
