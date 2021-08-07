import heads from "../assets/snakes/heads/[name].svg"
import tails from "../assets/snakes/tails/[name].svg"

interface Cache {
  heads: {[key: string]: SVGSVGElement },
  tails: {[key: string]: SVGSVGElement },
}

const cache: Cache = {
  heads: {},
  tails: {},
};

export async function fetchHead(name: string): Promise<SVGSVGElement> {
  if (cache.heads[name]) {
    return cache.heads[name];
  }
  const fetcher = heads[name] || heads.default;
  const module = await fetcher();
  const svg = module.default();
  cache.heads[name] = svg;
  return svg;
}

export async function fetchTail(name: string): Promise<SVGSVGElement> {
  if (cache.tails[name]) {
    return cache.tails[name];
  }
  const fetcher = tails[name] || tails.default;
  const module = await fetcher();
  const svg = module.default();
  cache.tails[name] = svg;
  return svg;
}

export function getHead(name: string): SVGSVGElement {
  return cache.heads[name];
}

export function getTail(name: string): SVGSVGElement {
  return cache.tails[name];
}
