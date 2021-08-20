import { ComponentProps } from "solid-js";
import heads from "../assets/snakes/heads/[name].svg"
import tails from "../assets/snakes/tails/[name].svg"

const DEFAULT_HEAD = "default";
const DEFAULT_TAIL = "default";

type SVGComponent = (props?: ComponentProps<'svg'>) => SVGSVGElement;
interface Cache {
  heads: {[key: string]: SVGComponent },
  tails: {[key: string]: SVGComponent },
}

const cache: Cache = {
  heads: {},
  tails: {},
};

export async function fetchHead(name: string): Promise<SVGComponent> {
  if (cache.heads[name]) {
    return cache.heads[name];
  }
  const fetcher = heads[name] || heads[DEFAULT_HEAD];
  const module = await fetcher();
  const svgComponent = module.default;
  cache.heads[name] = svgComponent;
  return svgComponent;
}

export async function fetchTail(name: string): Promise<SVGComponent> {
  if (cache.tails[name]) {
    return cache.tails[name];
  }
  const fetcher = tails[name] || tails[DEFAULT_TAIL];
  const module = await fetcher();
  const svgComponent = module.default;
  cache.tails[name] = svgComponent;
  return svgComponent;
}

export function getHead(name: string): SVGComponent {
  return cache.heads[name];
}

export function getTail(name: string): SVGComponent {
  return cache.tails[name];
}
