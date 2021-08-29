import { Test, TestPreview } from "../model";
import { openDB } from "idb";
import * as R from "ramda";

export type Subscriber = (before?: Test, after?: Test) => void;
export interface TestStore {
  list(): Promise<TestPreview[]>,
  save(test: Test): Promise<void>,
  delete(id: string): Promise<void>,
  read(id: string): Promise<Test>,
  suscribe(fn: Subscriber): void,
}


export function indexdbTestStore(): TestStore {
  const STORE_NAME = "Tests";
  const dbPromise = openDB("TestStorage", 1, {
    upgrade(db) {
      db.createObjectStore(STORE_NAME, {keyPath: "id"});
    },
  });

  const subscribers: Subscriber[] = [];
  const notify = (before?: Test, after?: Test) => subscribers.forEach(fn => fn(before, after));

  return {
    async list() {
      const db = await dbPromise;
      let cursor = await db.transaction(STORE_NAME).store.openCursor();
      const items: TestPreview[] = [];

      while (cursor) {
        items.push({ id: cursor.value.id, description: cursor.value.description, timestamp: cursor.value.timestamp });
        cursor = await cursor.continue();
      }

      return R.sortBy(a => a.timestamp, items);
    },

    async save(test) {
      const db = await dbPromise;
      const store = db.transaction(STORE_NAME, "readwrite").objectStore(STORE_NAME);
      await store.add(test);
      notify(undefined, test);
      return;
    },

    async delete(id) {
      const db = await dbPromise;
      const store = db.transaction(STORE_NAME, "readwrite").objectStore(STORE_NAME);
      const test = await store.get(id);
      await store.delete(id);
      notify(test, undefined);
    },

    async read(id) {
      const db = await dbPromise;
      const store = db.transaction(STORE_NAME).objectStore(STORE_NAME);
      return store.get(id);
    },

    suscribe(fn) {
      subscribers.push(fn);
    },
  };
}


// async function exportToJson(db: IDBPDatabase): Promise<any> {
//     const exportObject: {[key: string]: any} = {}

//     for (const storeName of db.objectStoreNames) {
//       let cursor = await db.transaction(storeName).store.openCursor();
//       const items = [];
//       while (cursor) {
//         items.push(cursor.value);
//         cursor = await cursor.continue();
//       }
//       exportObject[storeName] = items;
//     }

//     return exportObject;
// }

// async function importFromJson(db: IDBPDatabase, json: any) {
//   for (const storeName of db.objectStoreNames) {
//     const store = db.transaction(storeName, 'readwrite').store;
//     const promises = [];
//     for (const toAdd of json[storeName]) {
//       promises.push(store.add(toAdd))
//     }
//     await Promise.all(promises);
//   }
// }
