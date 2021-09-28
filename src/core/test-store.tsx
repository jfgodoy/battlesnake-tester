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
  exportToJson(): Promise<ExportedData>,
  importFromJson(data: ExportedData, options: {mode: "add" | "replace"}): Promise<void>,
}
export type ExportedData = {
  version: "1",
  tests: Test[],
}

export function indexdbTestStore(): TestStore {
  let addExamples = false;
  const STORE_NAME = "Tests";
  const dbPromise = openDB("TestStorage", 1, {
      async upgrade(db, oldversion) {
        db.createObjectStore(STORE_NAME, {keyPath: "id"});
        if (oldversion == 0) {
          addExamples = true;
        }
      },
    })
    .then(async db => {
      if (addExamples) {
        const examples = (await import("./examples")).default;
        const store = db.transaction(STORE_NAME, "readwrite").objectStore(STORE_NAME);
        await Promise.all(examples.map(example => store.put(example)));
      }
      return db;
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
      const previous = await store.get(test.id);
      await store.put(test);
      notify(previous, test);
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

    async exportToJson(): Promise<ExportedData> {
      const db = await dbPromise;
      let cursor = await db.transaction(STORE_NAME).store.openCursor();
      const data: ExportedData = {
        version: "1",
        tests: []
      };

      while (cursor) {
        data.tests.push(cursor.value);
        cursor = await cursor.continue();
      }

      return data;
    },

    async importFromJson(data: ExportedData, options: {mode: "add" | "replace"}) {
      const db = await dbPromise;
      const store = db.transaction(STORE_NAME, "readwrite").objectStore(STORE_NAME);

      if (options.mode == "replace") {
        store.clear();
      }

      const promises = data.tests.map(test => store.put(test));
      await Promise.all(promises);
    }
  };
}



