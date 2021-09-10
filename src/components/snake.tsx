import { Show, createResource, ComponentProps, splitProps, JSX } from "solid-js";
import { fetchSVG } from "../core/svg-fetcher";
import styles from "./snake.module.css";

const Snake = (props: ComponentProps<"div"> & {color: string, head: string, tail: string}): JSX.Element => {
  const [_, otherProps] = splitProps(props, ["color", "head", "tail"]);
  const fetchSvg = async () => {
    const Head = await fetchSVG("head", props.head);
    const Tail = await fetchSVG("tail", props.tail);
    return {Head, Tail};
  };

  const [res] = createResource(fetchSvg);
  return (
    <Show when={res()}>
      {({Head, Tail}) => (
        <div {...otherProps} classList={{"flex": true, [styles.snake]: true}}>
          <span class={styles.tail}><Tail fill={props.color} /></span>
          <span class={styles.body} style={{"background-color": props.color}}></span>
          <span class={styles.head}><Head fill={props.color}/></span>
        </div>
      )}
    </Show>
  );
};


export default Snake;
