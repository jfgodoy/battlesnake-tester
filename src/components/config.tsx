import { Switch, Match, createEffect, createResource } from "solid-js";
import { Signal, onBlur, model, autoresize, useDirective } from "../solid-extensions";
import SnakeComponent from "./snake";

useDirective(model);
useDirective(autoresize);

export default function Config(props: { server: Signal<string>, style: Signal<{color: string, head: string, tail: string} | null>}) {
  const [server, setServer] = props.server;
  const [style, setStyle] = props.style;

  const fetchStyle = async (server: string) => {
    const resp = await fetch(server).then(res => res.json());
    const {color, head, tail} = resp;
    return {color, head, tail};
  }

  const [resource] = createResource(server, fetchStyle);

  createEffect(() => setStyle(resource.loading ? null : resource.error ? null : resource()!));

  return (
    <div class="flex items-center">
      <span class="font-bold text-gray-500">Server:</span>
      <input
        class="ml-1 px-3 rounded bg-gray-100 text-gray-700 round min-w-44 w-0"
        use:autoresize
        use:model={onBlur(server, setServer)}
      />
      <Switch>
        <Match when={resource.loading}><span>loading...</span></Match>
        <Match when={resource.error}>
          {(e) => <span class="text-red-400 font-bold">Error: {e.message}</span>}
        </Match>
        <Match when={style()}>
          {(s) => <SnakeComponent class="mx-2" color={s.color} head={s.head} tail={s.tail} />}
        </Match>
      </Switch>
    </div>
  );
}
