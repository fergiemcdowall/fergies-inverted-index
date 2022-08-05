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
    DISTINCT: DISTINCT;
    EXIST: EXIST;
    EXPORT: EXPORT;
    FACETS: FACETS;
    FIELDS: FIELDS;
    GET: GET;
    INTERSECTION: AND;
    LAST_UPDATED: LAST_UPDATED;
    MAX: MAX;
    MIN: MIN;
    OBJECT: OBJECT;
    SET_SUBTRACTION: NOT;
    SORT: SORT;
    UNION: OR;
    parseToken: (token: import("./parseToken.js").Token) => Promise<import("./parseToken.js").TokenObject>;
};
declare namespace read {
    export { KeyValueObject, RangeOptions, EXPORT, AlterToken, MatchObject, QueryObject, GET, UnionQueryObject, OR, AND, NOT, FIELDS, CREATED, LAST_UPDATED, EXIST, BucketObject, BUCKET, BUCKETS, IDObject, ObjectObject, OBJECT, MAX, MIN, DISTINCT, FacetObject, FACETS, SORT };
}
type BUCKET = (token: import("./parseToken.js").Token) => Promise<BucketObject>;
type BUCKETS = (...tokens: import("./parseToken.js").Token[]) => Promise<BucketObject[]>;
/**
 * Returns the timestamp that indicates when the index was created
 */
type CREATED = () => Promise<number | undefined>;
/**
 * Returns every object in the db that is greater than equal to GTE and less than or equal to LTE (sorted alphabetically)
 */
type DISTINCT = (...tokens: import("./parseToken.js").Token[]) => Promise<KeyValueObject[]>;
/**
 * Indicates whether documents with the given ids exist in the index
 */
type EXIST = (...ids: any[]) => Promise<any[]>;
/**
 * Exports the index
 */
type EXPORT = (options?: RangeOptions) => Promise<KeyValueObject[]>;
/**
 * Creates an aggregation for each value in the given range.
 */
type FACETS = (...tokens: import("./parseToken.js").Token[]) => Promise<FacetObject[]>;
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
/**
 * Get the highest alphabetical value in a given token
 */
type MAX = (token: import("./parseToken").Token) => Promise<number>;
/**
 * Get the lowest alphabetical value in a given token
 */
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
 * Sorts results by `_id`
 */
type SORT = (results: IDObject[]) => Promise<IDObject[]>;
/**
 * Returns objects that match one or more of the query clauses
 */
type OR = (tokens: import("./parseToken.js").Token[], pipeline?: AlterToken) => Promise<UnionQueryObject>;
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
type FacetObject = {
    _id: any[];
    KEY: any;
    VALUE: any;
};
