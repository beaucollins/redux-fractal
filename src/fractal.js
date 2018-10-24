/**
 * @flow
 */

export function add<T: (string | number)>(a: T, b: T): T {
    return a + b;
}