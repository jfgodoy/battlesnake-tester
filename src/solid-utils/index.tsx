import { JSX } from "solid-js/jsx-runtime";

// eslint-disable-next-line
export function useDirective(...directives: Array<(el: JSX.Element) => void>): (el: JSX.Element) => void {
  return (el: JSX.Element) => {
    directives.forEach(f => f(el));
  };
}

export * from "./directive-model";
export * from "./directive-autoresize";
export * from "./types";
export * from "./signal-from-store";
