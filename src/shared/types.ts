/**
 * Defines a string dictionary.
 */
export interface IStringDictionary<T> {
    [index: string]: T;
}

/**
 * Defines a member that can have a value or be null.
 */
export type Nullable<T> = null | T;

/**
 * Defines a member that can have a value or be undefined.
 */
export type Undefinable<T> = undefined | T;
