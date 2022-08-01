export = read;
/**
 * @param {import("./main.js").FiiOptions & import("./main.js").InitializedOptions } ops
 */
declare function read(ops: import("./main.js").FiiOptions & import("./main.js").InitializedOptions): {
    AGGREGATE: ({ BUCKETS, FACETS, QUERY }: {
        BUCKETS: any;
        FACETS: any;
        QUERY: any;
    }) => Promise<{
        BUCKETS: any;
        FACETS: any;
        RESULT: any;
    }>;
    AGGREGATION_FILTER: (aggregation: any, filterSet: any) => any;
    BUCKET: BUCKET;
    BUCKETS: BUCKETS;
    CREATED: CREATED;
    DISTINCT: (...tokens: any[]) => Promise<any[]>;
    EXIST: EXIST;
    EXPORT: EXPORT;
    FACETS: (...tokens: any[]) => Promise<any[]>;
    FIELDS: FIELDS;
    GET: GET;
    INTERSECTION: AND;
    LAST_UPDATED: LAST_UPDATED;
    MAX: MAX;
    MIN: MIN;
    OBJECT: OBJECT;
    SET_SUBTRACTION: NOT;
    SORT: (results: any) => Promise<any>;
    UNION: UNION;
    parseToken: (token: import("./parseToken.js").Token) => Promise<import("./parseToken.js").TokenObject>;
};
declare namespace read {
    export { KeyValueObject, RangeOptions, EXPORT, AlterToken, MatchObject, QueryObject, GET, UnionQueryObject, UNION, AND, NOT, FIELDS, CREATED, LAST_UPDATED, EXIST, BucketObject, BUCKET, BUCKETS, IDObject, ObjectObject, OBJECT, MAX, MIN };
}
type BUCKET = (token: import("./parseToken.js").Token) => Promise<BucketObject>;
type BUCKETS = (...tokens: import("./parseToken.js").Token[]) => Promise<BucketObject[]>;
/**
 * Returns the timestamp that indicates when the index was created
 */
type CREATED = () => Promise<number | undefined>;
/**
 * Indicates whether documents with the given ids exist in the index
 */
type EXIST = (...ids: any[]) => Promise<any[]>;
/**
 * Exports the index
 */
type EXPORT = (options?: RangeOptions) => Promise<KeyValueObject[]>;
/**
 * Returns array of available fields in the index
 */
type FIELDS = () => Promise<string[]>;
/**
 * Returns all objects that match the query clause
 */
type GET = (token: import("./parseToken.js").Token, pipeline?: AlterToken) => Promise<QueryObject[]>;
/**
 * Returns objects that match every clause in the query
 */
type AND = (tokens: import("./parseToken.js").Token[], pipeline?: AlterToken) => Promise<QueryObject[]>;
/**
 * Returns a timestamp indicating when the index was last updated
 */
type LAST_UPDATED = () => Promise<number | undefined>;
type MAX = (token: import("./parseToken").Token) => Promise<number>;
type MIN = (token: import("./parseToken").Token, reverse: boolean) => Promise<number>;
/**
 * Extends object with document data
 */
type OBJECT = (ids: IDObject[]) => Promise<ObjectObject[]>;
/**
 * Returns objects that are present in A, but not in B
 */
type NOT = (a: import("./parseToken.js").Token, b: import("./parseToken.js").Token) => Promise<QueryObject[]>;
/**
 * Returns objects that match one or more of the query clauses
 */
type UNION = (tokens: import("./parseToken.js").Token[], pipeline?: AlterToken) => Promise<UnionQueryObject>;
type KeyValueObject = {
    key: any[];
    value: any;
};
type RangeOptions = import("level-read-stream").ReadStreamOptions & import("abstract-level").AbstractIteratorOptions<any, any>;
/**
 * Alters token
 */
type AlterToken = (token: import("./parseToken.js").Token) => Promise<import("./parseToken.js").Token>;
type MatchObject = {
    FIELD: string;
    VALUE: any;
    SCORE?: any;
};
type QueryObject = {
    _id: any;
    _match: MatchObject[];
};
type UnionQueryObject = {
    sumTokensMinusStopwords: number;
    union: QueryObject[];
};
type BucketObject = {
    _id: any[];
    VALUE: import("./parseToken.js").RangeObject;
};
type IDObject = {
    _id: any;
};
type ObjectObject = {
    _id: any;
    _object: IDObject;
};
