import { Test } from "./model";
import { openDB } from 'idb';

export type TestPreview = Pick<Test, "id" | "description">;
export interface TestStore {
  list(): Promise<TestPreview[]>,
  save(test: Test): Promise<void>,
  remove(id: string): Promise<void>,
  read(id: string): Promise<Test>
}


export function indexdbTestStore(): TestStore {
  const STORE_NAME = "Tests";
  const dbPromise = openDB("MyDatabase", 1, {
    upgrade(db) {
      db.createObjectStore(STORE_NAME, {keyPath: "id"});
    },
  });

  return {
    async list() {
      const db = await dbPromise;
      let cursor = await db.transaction(STORE_NAME).store.openCursor();
      const items: TestPreview[] = [];

      while (cursor) {
        items.push({ id: cursor.value.id, description: cursor.value.description });
        cursor = await cursor.continue();
      }

      return items;
    },

    async save(test) {
      const db = await dbPromise;
      const store = db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME);
      await store.add(test);
      return
    },

    async remove(id) {
      const db = await dbPromise;
      const store = db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME);
      return store.delete(id);
    },

    async read(id) {
      const db = await dbPromise;
      const store = db.transaction(STORE_NAME).objectStore(STORE_NAME);
      return store.get(id);
    }
  }
}
