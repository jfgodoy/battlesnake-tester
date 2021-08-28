import { ModelOpts } from "./directive-model";

declare module "solid-js" {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface Directives {
      "$autoresize": boolean,
      "$model": ModelOpts,
    }
  }
}

export * from "./directive-model";
export * from "./directive-autoresize";
export * from "./types";
export * from "./signal-from-store";
