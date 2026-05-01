type Primitive = string | number | boolean | bigint | symbol | null | undefined;

export type DotPaths<T, Prefix extends string = ""> = {
  [K in keyof T]: T[K] extends Primitive
    ? `${Prefix}${K & string}`
    : T[K] extends readonly unknown[]
      ? `${Prefix}${K & string}`
      : DotPaths<T[K], `${Prefix}${K & string}.`>;
}[keyof T];
