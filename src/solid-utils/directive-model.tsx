import { createRenderEffect } from "solid-js";
import { Getter, Setter } from "./types";

export type ModelOpts = {
  get: Getter<string>,
  set: Setter<string>,
  updateOn: "blur" | "input",
}

export function useModel(value: ModelOpts): (el: HTMLInputElement) => void {
  return (el: HTMLInputElement) => {
    const opts = value;
    createRenderEffect(() => (el.value = opts.get()));
    el.addEventListener(opts.updateOn, (e) => opts.set((e.target as HTMLInputElement).value));
  };
}

export const onInput = (get: Getter<string>, set: Setter<string>): ModelOpts => ({get, set, updateOn: "input" });
export const onBlur = (get: Getter<string>, set: Setter<string>): ModelOpts => ({get, set, updateOn: "blur" });
