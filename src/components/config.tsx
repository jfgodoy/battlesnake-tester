import { Switch, Match, createEffect, createResource, JSX } from "solid-js";
import { Setter, Signal, onBlur, $model, $autoresize } from "../solid-utils";
import SnakeComponent from "./snake";

export default function Config(props: { server: Signal<string>, style: Signal<{color: string, head: string, tail: string} | undefined>, setView: Setter<string>}): JSX.Element {
  const [server, setServer] = props.server;
  const [style, setStyle] = props.style;

  const fetchStyle = async (server: string) => {
    const resp = await fetch(server).then(res => res.json());
    const {color, head, tail} = resp;
    return {color, head, tail};
  };

  const [resource, { refetch }] = createResource(server, fetchStyle);

  createEffect(() => setStyle((resource.loading || resource.error) ? undefined : resource()));

  return (
    <div class="flex items-center">
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
          {(s) => <SnakeComponent class="mx-2" color={s.color} head={s.head} tail={s.tail} />}
        </Match>
      </Switch>
      <button class="bg-blue-400 text-white ml-8 px-2 font-bold rounded" onclick={() => props.setView("importer")}>Import Game</button>
    </div>
  );
}
