export = main;
/**
 * Creates and intializes index
 * @param {FiiOptions} [ops] Options
 * @returns Promise<Object>
 */
declare function main(ops?: FiiOptions): Promise<any>;
declare namespace main {
    export { FiiOptions };
}
/**
 * Fii options
 */
type FiiOptions = {
    /**
     * Name of `abstract-level` compatible database
     */
    name?: string;
    /**
     * Creates 'comment' spaces in tokens.
     * For example using `#` allows tokens like `boom#1.00` to be retrieved by using `boom`.
     * If `tokenAppend` wasnt used, then `{gte: 'boom', lte: 'boom'}` would also return stuff like `boomness#1.00` etc
     */
    tokenAppend?: string;
    /**
     * Sets case sensitivity of the index
     */
    caseSensitive?: boolean;
    /**
     * Array of stop words to be stripped using [`stopword`](https://github.com/fergiemcdowall/stopword)
     */
    stopwords?: string[];
    /**
     * Array of fields not to index
     */
    doNotIndexField?: string[];
    storeVectors?: boolean;
    /**
     * Field used to verify that doc exists
     */
    docExistsSpace?: string;
};
