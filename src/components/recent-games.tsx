import { createSignal, JSX, For, Show, Switch, Match, createEffect } from "solid-js";
import { createStore } from "solid-js/store";
import { Test, Game, Frame } from "../model";
import { importGame } from "../core/importer";
import { Getter, Setter, $model, onBlur } from "../solid-utils";
import Modal from "./modal";

type RecentGameApi = {
  gameId: string,
  arena: string,
  board: string,
  date: string,
};

type RecentGame = RecentGameApi & {importState: undefined|"string"}


function ConfigModal(props: {showConfig: Getter<boolean>, setShowConfig: Setter<boolean>, snakeUrl: Getter<string|undefined>, setSnakeUrl: Setter<string|undefined>}) {
  const [error, setError] = createSignal("");
  let snakeUrl = props.snakeUrl();

  function saveAndClose() {
    if (typeof snakeUrl == "string") {
      snakeUrl = snakeUrl.trim();
      if (snakeUrl == "") {
        snakeUrl = undefined;
      } else if (!/^https:\/\/play.battlesnake.com\/u\/[^/]+\/[^/]+\/?$/.test(snakeUrl)) {
        setError("invalid format");
        return;
      }
    }
    props.setSnakeUrl(snakeUrl);
    props.setShowConfig(false);
  }

  return (
  <Modal title="Config Recent Games" switch={[props.showConfig, props.setShowConfig]}>
    <div class="flex-1 p-4">
      <p class="text-gray-700">Set your snake url:</p>
      <input type="text" class="w-7/12 min-w-96 p-0 px-3 rounded text-gray-700 border-gray-300" onInput={() => setError("")} use:$model={onBlur(props.snakeUrl, (val) => { snakeUrl = val; })} />
      <button class="ml-2 bg-blue-400 text-white px-2 font-bold rounded" onclick={saveAndClose}>Save</button>
      <p class="text-red-500">{error()}</p>
      <p class="text-xs text-gray-600">It should have this format https://play.battlesnake.com/u/&lt;username&gt;/&lt;snake-name&gt;/</p>
    </div>
  </Modal>
  );
}


export default function RecentGames(props: { createTest: (game: Game, frames: Frame[]) => Promise<Test>, setView: Setter<string>, snakeUrl: Getter<string|undefined>, setSnakeUrl: Setter<string|undefined>}): JSX.Element {
  const [showConfig, setShowConfig] = createSignal(false);
  const [error, setError] = createSignal("");
  const [recentGames, setRecentGames] = createStore<{games: RecentGame[]}>({games: []});
  const [loading, setLoading] = createSignal(false);

  const doImport = async (idx: number) => {
    const setImportState = (state: string) => setRecentGames("games", idx, "importState", state);
    setImportState("importing...");
    const gameId = recentGames.games[idx].gameId;
    const res = await importGame(gameId)
      .catch(e => {
        // TODO: improve error messages
        setImportState(e);
        throw e;
      });

    props.createTest(res.game, res.frames);
    props.setView("test");
    setImportState("done!");
    setTimeout(() => setImportState(""), 1000);
  };



  async function dofetch() {
    setError("");
    const snakeUrl = props.snakeUrl();
    if (!snakeUrl) {
      console.log(new Error("missing snake url"));
      return;
    }
    setLoading(true);
    const url = "https://battlesnake-tester-server.jgodoy.cl/recent-games/" + snakeUrl.replace("https://play.battlesnake.com/", "");
    const res = await fetch(url);
    if (!res.ok) {
      setError(res.statusText);
      setRecentGames("games", []);
      setLoading(false);
      return;
    }
    const data = await res.json();
    setRecentGames("games", data);
    setLoading(false);
  }

  createEffect(() => dofetch());

  return (
    <div class="flex flex-col w-full">
      <div class="flex flex-0 mb-4">
        <p class="flex-1 font-bold text-gray-500 px-4 py-4">Recent games</p>
        <Show when={props.snakeUrl()}>
          <button class="text-gray-500 px-2 font-bold rounded" onclick={() => setShowConfig(true)}>
            <IconPhGearSix />
          </button>
          <button class="text-gray-500 px-2 mr-2 font-bold rounded" onclick={dofetch}>
            <IconJamRefreshReverse />
          </button>
        </Show>
      </div>
      <div class="overflow-y-auto">
        <Show when={loading()}>
          <p class="text-gray-700 px-4">loading...</p>
        </Show>
        <Switch>
          <Match when={!props.snakeUrl()}>
            <div class="px-4">
              <p class="text-gray-700">Configure your snake url to fetch its recent games and easily import them.</p>
              <p class="text-center my-4"><button class="bg-blue-400 text-white px-2 font-bold rounded" onclick={() => setShowConfig(true)}>Configure</button></p>
            </div>
          </Match>
          <Match when={error()}>
            <div class="mx-4">
              <h3 class="text-red-500">Whops!</h3>
              <p class="text-red-500">{error}</p>
              <p class="mt-4 text-gray-700 break-words">Check if you can reach the configured snake url: <a href={props.snakeUrl()} target="_blank">{props.snakeUrl()}</a></p>
            </div>
          </Match>
          <Match when={props.snakeUrl()}>
            <div class="flex-1 space-y-2 divide-y divide-gray-200 text-gray-600">
              <For each={recentGames.games}>
                {
                  (recentGame, i) => <div class="px-4">
                    <p class="flex pt-3 items-baseline">
                      <span class="flex-1">{recentGame.arena}</span> <span class="text-sm">{recentGame.date}</span>
                    </p>
                    <p>{recentGame.board}</p>
                    <p>
                      <button class="border border-gray-300 rounded px-2 text-xs hover:bg-blue-400 hover:text-white hover:border-blue-500 text-gray-500" onclick={() => doImport(i())}>import</button>
                      <span class="ml-2">{recentGame.importState}</span>
                    </p>
                  </div>
                }
              </For>
            </div>
          </Match>
        </Switch>
      </div>
      <ConfigModal showConfig={showConfig} setShowConfig={setShowConfig} snakeUrl={props.snakeUrl} setSnakeUrl={props.setSnakeUrl} />
    </div>
  );
}
