import { ModelOpts } from "./directive-model";

declare module "solid-js" {
  namespace JSX {
    interface Directives {
      "autoresize": boolean,
      "model": ModelOpts,
      "model:input": ModelOpts,
    }
  }
}

export function useDirective(_directive: any) {
  /* this function does nothing. It's just a workaround to avoid
  babel tree shake our directive before solidjs has the oportunity to use it
  */
}

export * from "./directive-model";
export * from "./directive-autoresize";
export * from "./types";
export * from "./signal-from-store";
