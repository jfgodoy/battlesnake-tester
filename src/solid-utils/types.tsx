/* simplified solid types */
export type Getter<T> = () => T;
export type Setter<T> = (value: T) => void;
export type Signal<T> = [Getter<T>, Setter<T>];
