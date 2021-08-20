import { Show, createResource } from "solid-js";
import { fetchHead, fetchTail } from "../utils/svg-fetcher";
import styles from "./snake.module.css";

const Snake = (props: {color: string, head: string, tail: string}) => {
  const fetchSvg = async () => {
    const Head = await fetchHead(props.head);
    const Tail = await fetchTail(props.tail);
    return {Head, Tail}
  }

  const [res] = createResource(fetchSvg);

  return (
    <Show when={res()}>
      {({Head, Tail}) => (
        <span class="flex mx-2">
          <span class={styles.tail}><Tail fill={props.color} /></span>
          <span class={styles.body} style={{"background-color": props.color}}></span>
          <span class={styles.head}><Head fill={props.color}/></span>
        </span>
      )}
    </Show>
  )
};


export default Snake;
