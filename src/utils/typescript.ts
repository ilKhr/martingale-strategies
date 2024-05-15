type Primitive = string | number | boolean | bigint | symbol | undefined | null;

export const isType =
  <T extends Primitive & S, S>(matcher: T) =>
  (x: S): x is T =>
    x === (matcher as Primitive);

/*
Рубрика "разберёмся"

Фильтр на вход получает фукцию (one) =>
При попадании этой функции в фильтр аргументом ONE становится параметр, который пробрасывает filter
остаётся (two) => two === one
Аргументов two становится аргумент, который пробрасываем мы
*/
