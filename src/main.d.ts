export = main;
/**
 * Creates and intializes index
 * @param {FiiOptions} [ops] Options
 */
declare function main(ops?: FiiOptions): Promise<Fii>;
declare namespace main {
    export { AbstractLevelConstructor, FiiOptions, InitializedOptions, OR, Fii };
}
/**
 * Fii options
 */
type FiiOptions = {
    /**
     * Name of database
     */
    name?: string;
    /**
     * Constructor of `class` extending [`abstract-level`](https://github.com/Level/abstract-level)
     */
    db?: AbstractLevelConstructor;
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
type Fii = {
    AND: import("./read.js").INTERSECTION;
    DELETE: import("./write.js").DELETE;
    EXPORT: import("./read.js").EXPORT;
    GET: import("./read.js").GET;
    IMPORT: import("./write.js").IMPORT;
    NOT: import("./read.js").SET_SUBTRACTION;
    OR: OR;
    PUT: import("./write.js").PUT;
    TIMESTAMP_LAST_UPDATED: import("./write.js").TIMESTAMP_LAST_UPDATED;
};
type AbstractLevelConstructor = new <K, V>(name: string, options?: import("abstract-level").AbstractDatabaseOptions<K, V>) => import("abstract-level/types/abstract-level.js").AbstractLevel<any, K, V>;
type InitializedOptions = {
    _db: import("abstract-level/types/abstract-level.js").AbstractLevel<any, string, string>;
};
/**
 * Returns objects that match one or more of the query clauses
 */
type OR = (tokens: import("./parseToken.js").Token[], pipeline?: import("./read.js").AlterToken) => Promise<import("./read.js").QueryObject[]>;
