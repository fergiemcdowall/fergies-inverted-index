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
    AND: import("./read.js").AND;
    BUCKET: import("./read.js").BUCKET;
    BUCKETS: import("./read.js").BUCKETS;
    CREATED: import("./read.js").CREATED;
    DELETE: import("./write.js").DELETE;
    DISTINCT: import("./read.js").DISTINCT;
    EXIST: import("./read.js").EXIST;
    EXPORT: import("./read.js").EXPORT;
    FACETS: import("./read.js").FACETS;
    FIELDS: import("./read.js").FIELDS;
    GET: import("./read.js").GET;
    IMPORT: import("./write.js").IMPORT;
    LAST_UPDATED: import("./read.js").LAST_UPDATED;
    MAX: import("./read.js").MAX;
    MIN: import("./read.js").MIN;
    NOT: import("./read.js").NOT;
    OBJECT: import("./read.js").OBJECT;
    OR: OR;
    PUT: import("./write.js").PUT;
    SORT: import("./read.js").SORT;
    STORE: import("abstract-level/types/abstract-level.js").AbstractLevel<any, string, string>;
    TIMESTAMP_LAST_UPDATED: import("./write.js").TIMESTAMP_LAST_UPDATED;
    parseToken: import("./parseToken.js").PARSE;
};
type AbstractLevelConstructor = new <K, V>(name: string, options?: import("abstract-level").AbstractDatabaseOptions<K, V>) => import("abstract-level/types/abstract-level.js").AbstractLevel<any, K, V>;
type InitializedOptions = {
    _db: import("abstract-level/types/abstract-level.js").AbstractLevel<any, string, string>;
};
/**
 * Returns objects that match one or more of the query clauses
 */
type OR = (tokens: import("./parseToken.js").Token[], pipeline?: import("./read.js").AlterToken) => Promise<import("./read.js").QueryObject[]>;
