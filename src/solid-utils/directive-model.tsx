import { createRenderEffect } from "solid-js";
import { Getter, Setter } from "./types";

export type ModelOpts = {
  get: Getter<string|undefined>,
  set: Setter<string>,
  updateOn: "blur" | "input",
}

export function $model(el: HTMLInputElement, value: Getter<ModelOpts>): void {
  const opts = value();
  createRenderEffect(() => (el.value = opts.get() || ""));
  el.addEventListener(opts.updateOn, (e) => opts.set((e.target as HTMLInputElement).value));
}

export const onInput = (get: Getter<string|undefined>, set: Setter<string>): ModelOpts => ({get, set, updateOn: "input" });
export const onBlur = (get: Getter<string|undefined>, set: Setter<string>): ModelOpts => ({get, set, updateOn: "blur" });
