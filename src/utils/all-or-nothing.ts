/* eslint @typescript-eslint/no-explicit-any: "off" */

type NonNullTuple<A extends readonly any[]> = A extends []
? []
: A extends readonly [infer Head, ...infer Tail]
? [Exclude<Head, undefined | null>, ...NonNullTuple<Tail>]
: never

export default function allOrNothing<T extends readonly any[]>(array: T): NonNullTuple<T> | false {
  return array.every(v => !!v) ? array as any : false;
}
