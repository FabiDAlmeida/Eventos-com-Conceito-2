
import { Project } from '../types';

const DB_NAME = 'EventArchitectDB';
const DB_VERSION = 1;
const STORE_NAME = 'projects';

export const dbService = {
  async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = () => reject('Error opening database');
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
    });
  },

  async saveProjects(projects: Project[]): Promise<void> {
    const db = await this.openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    // Clear old data and save current set
    // In a more complex app we'd sync individual items, 
    // but for this architecture we maintain the projects array sync
    return new Promise((resolve, reject) => {
      store.clear().onsuccess = () => {
        projects.forEach(project => store.add(project));
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject('Error saving projects');
      };
    });
  },

  async getProjects(): Promise<Project[]> {
    const db = await this.openDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject('Error fetching projects');
    });
  }
};
