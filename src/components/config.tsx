import { Show, Switch, Match, createSignal, createEffect, createResource, JSX } from "solid-js";
import { Setter, Signal, onBlur, $model, $autoresize } from "../solid-utils";
import SnakeComponent from "./snake";
import { Snake, Test } from "../model";
import ow from "ow";

type ConfigOpts = {
  server: Signal<string>,
  style: Signal<Pick<Snake, "color" | "headType" | "tailType">| undefined>,
  setView: Setter<string>,
  createEmptyTest: () => Promise<Test>,
}

const fetchJSON = async (url: string): Promise<unknown> => {
  return fetch(url)
    .then(res => res.json())
    .catch(err => {
      // check request if failed due to CORS
      const firstErr = err;
      return fetch(url, {mode: "no-cors"})
        .then(
          _onResolve => { throw new Error("your server hasn't enabled CORS"); },
          _onReject => { throw firstErr; }
        );
    });
};

export default function Config(props: ConfigOpts): JSX.Element {
  const [server, setServer] = props.server;
  const [style, setStyle] = props.style;

  const fetchStyle = async (server: string) => {
    const resp = await fetchJSON(server);
    ow(resp, ow.object.partialShape({color: ow.string, head: ow.string, tail: ow.string}));
    const {color, head, tail} = resp;
    return {color, headType: head, tailType: tail};
  };

  const [resource, { refetch }] = createResource(server, fetchStyle);

  createEffect(() => setStyle((resource.loading || resource.error) ? undefined : resource()));

  const boardBuilder = async () => {
    await props.createEmptyTest();
    props.setView("builder");
  };

  const [showMenu, setMenu] = createSignal(false);
  const handleAction = <T extends Array<unknown>>(fn: (...args: T) => void, ...args: T): (() => void) => {
    return () => {
      setMenu(false);
      fn(...args);
    };
  };

  return (
    <div class="flex items-center">
      <div style="min-width:308px">
      <span class="font-bold text-gray-500">Server:</span>
      <input
        class="ml-1 px-3 rounded bg-gray-100 text-gray-700 round min-w-44 w-0"
        use:$autoresize
        use:$model={onBlur(server, setServer)}
      />
      <Switch>
        <Match when={resource.loading}><span>loading...</span></Match>
        <Match when={resource.error}>
          {(e) => <>
            <span class="text-red-400 font-bold">Error: {e.message}</span>
            <button class="border border-gray-400 rounded text-xs px-2 ml-3 text-gray-600" onclick={() => refetch()}>retry</button>
          </>}
        </Match>
        <Match when={style()}>
          {(s) => <SnakeComponent class="mx-2" color={s.color} head={s.headType} tail={s.tailType} />}
        </Match>
      </Switch>
      </div>
      <button class="bg-blue-400 text-white ml-8 px-2 font-bold rounded" onclick={() => props.setView("importer")}>New test</button>
      <button class="bg-blue-400 text-white ml-8 px-2 font-bold rounded" onclick={boardBuilder}>Board builder</button>
      <div class="flex-1 flex justify-end">
        <div class="relative">
          <button onclick={() => setMenu(!showMenu())} class="relative block rounded-md bg-white p-2 ml-1 border border-white hover:border-gray-200 focus:outline-none">
            <IconFeatherMoreVertical class="text-gray-500" />
          </button>

          <Show when={showMenu()}>
            <div onclick={() => setMenu(false)} class="fixed inset-0 h-full w-full z-10"></div>
            <div class="absolute right-0 mt-2 py-2 w-48 bg-white rounded-md shadow-md z-20 border border-gray-100">
              <button onclick={handleAction(props.setView, "exportimportdb")} class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-yellow-100">
                Export/Import DB
              </button>
            </div>
          </Show>
        </div>
      </div>
    </div>
  );
}
