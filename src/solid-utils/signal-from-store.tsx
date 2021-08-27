/* eslint @typescript-eslint/no-explicit-any: "off" */

import { Get } from "type-fest";
import { Store, SetStoreFunction } from "solid-js/store";

export type SignalFromStoreReturnType<T, PathType> = PathType extends string
? PathType extends ""
  ? never : Get<T, PathType> extends never
    ? undefined
    : [() => Get<T, PathType>, (value: Get<T, PathType>) => void]
  : never;

export function	signalFromStore<T, PathType extends string>(store: Store<T>, setStore: SetStoreFunction<T>, path: PathType extends "" ? never : PathType): SignalFromStoreReturnType<T, PathType> {
  const pathArray = path.split(".");

  const getter = () => {
    let current: any = store;

    for (let i = 0; i < pathArray.length; i++) {
      current = current[pathArray[i]];

      if (current === undefined || current === null) {
        // `object` is either `undefined` or `null` so we want to stop the loop, and
        // if this is not the last bit of the path, and
        // if it did't return `undefined`
        // it would return `null` if `object` is `null`
        // but we want `get({foo: null}, 'foo.bar')` to equal `undefined`, or the supplied value, not `null`
        if (i !== pathArray.length - 1) {
          return undefined;
        }

        break;
      }
    }
    return current;
  };

  const setter = (value: Get<T, PathType>) => {
    return setStore.call(null, ...pathArray, value);
  };

  return [getter, setter] as any;
}
