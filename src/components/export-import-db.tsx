import { saveAs } from "file-saver";
import { createSignal, JSX } from "solid-js";
import type { ExportedData } from "../core/test-store";

type ExportImportDBProps = {
  exportToJson: () => Promise<ExportedData>,
  importFromJson: (data: ExportedData, options: {mode: "add" | "replace"}) => Promise<void>,
}

export default function ExportImportDB(props: ExportImportDBProps): JSX.Element {
  async function generateBackup() {
    const data = await props.exportToJson();
    const text = JSON.stringify(data, null, 2);
    const blob = new Blob([text], {type: "application/json;charset=utf-8"});
    saveAs(blob, "battlesnake-tester-db.json");
  }

  const [mode, setMode] = createSignal("add" as "add" | "replace");
  const [importStatus, setImportStatus] = createSignal("");
  async function handleFile(ev: InputEvent) {
    setImportStatus("loading...");
    const el = ev.target as HTMLInputElement;
    const files = el.files;
    if (!files || files.length == 0) {
      return;
    }
    const file = files[0];

    const data: ExportedData = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = function () {
        try {
          const data = JSON.parse(reader.result as string);
          resolve(data);
        } catch (err) {
          setImportStatus("file must be json");
          reject(err);
        }
      };
      reader.readAsText(file);
    });

    props.importFromJson(data, {mode: mode()})
      .then(() => setImportStatus("file imported!"))
      .catch(err => setImportStatus(`Error: ${err.message}`));

  }

  return (
    <div>

      <div class="m-4 p-6 bg-white shadow">
        <h3 class="text-lg text-gray-700">DB Exporter</h3>
        <div class="flex my-4">
          <div class="space-y-2">
            <div>
              <p>Create a backup of all your tests for example to migrate to another browser, share with friends, or offline processing.</p>
              <button class="bg-blue-400 text-white mt-2 px-2 font-bold rounded" onclick={generateBackup}>Generate backup</button>
            </div>
          </div>
        </div>
      </div>
      <div class="m-4 p-6 bg-white shadow">
        <h3 class="text-lg text-gray-700">DB Importer</h3>
        <div class="my-4">
          <div>
            <div><input type="radio" name="mode" id="add" value="add" checked oninput={() => setMode("add")} /><label for="add" class="ml-2">Keep existing tests</label></div>
            <div><input type="radio" name="mode" id="replace" value="replace" oninput={() => setMode("replace")} /><label for="replace" class="ml-2">Remove existing tests</label></div>
          </div>
          <div class="mt-2">
            <label for="files" class="bg-blue-400 text-white text-base mt-2 px-2 py-1 font-bold rounded">Import backup file</label>
            <input id="files" style="visibility:hidden;" type="file" accept="application/json" oninput={handleFile}/>
            <p>{importStatus}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
