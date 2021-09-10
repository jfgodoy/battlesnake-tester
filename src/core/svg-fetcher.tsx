import { ComponentProps } from "solid-js";
import heads from "../assets/snakes/heads/[name].svg";
import tails from "../assets/snakes/tails/[name].svg";

const fetchers = {
  head: heads,
  tail: tails,
};

type SVGComponent = (props?: ComponentProps<"svg">) => SVGSVGElement;
interface Cache {
  head: {[key: string]: SVGComponent },
  tail: {[key: string]: SVGComponent },
}

const cache: Cache = {
  head: {},
  tail: {},
};

export async function fetchSVG(type: "head" | "tail", name: string): Promise<SVGComponent> {
  if (cache[type][name]) {
    return cache[type][name];
  }
  const fetcher = fetchers[type][name] || fetchers[type]["default"];
  const module = await fetcher();
  const svgComponent = module.default;
  cache[type][name] = svgComponent;
  return svgComponent;
}
