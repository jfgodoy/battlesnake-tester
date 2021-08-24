import { Accessor, createRenderEffect } from "solid-js";

/* simplified solid types */
export type Getter<T> = () => T;
export type Setter<T> = (value: T) => void;
export type Signal<T> = [Getter<T>, Setter<T>];

export function autoresize(el: HTMLInputElement) {
  let old_value = el.value;
  el.addEventListener("input", () => {
    if (old_value.length > el.value.length) {
      el.style.width = "0";
    }
    el.style.width = `${el.scrollWidth}px`
    old_value = el.value;
  });
}

type ModelOpts = {
  get: Getter<string>,
  set: Setter<string>,
  updateOn: "blur" | "input",
}
export function model(el: HTMLInputElement, value: Accessor<ModelOpts>) {
  const opts = value();
  createRenderEffect(() => (el.value = opts.get()));
  el.addEventListener(opts.updateOn, (e) => opts.set((e.target as HTMLInputElement).value));
}

export const onInput = (get: Getter<string>, set: Setter<string>): ModelOpts => ({get, set, updateOn: "input" })
export const onBlur = (get: Getter<string>, set: Setter<string>): ModelOpts => ({get, set, updateOn: "blur" })

export function useDirective(_directive: any) {
  /* this function does nothing. It's just a workaround to avoid
  babel tree shake our directive before solidjs has the oportunity to use it
  */
}


declare module "solid-js" {
  namespace JSX {
    interface Directives {
      "autoresize": boolean,
      "model": ModelOpts,
      "model:input": ModelOpts,
    }
  }
}
