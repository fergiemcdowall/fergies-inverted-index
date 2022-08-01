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
    BUCKET: (token: any) => Promise<tokenParser.TokenObject & {
        _id: any[];
        VALUE: tokenParser.RangeObject;
    }>;
    BUCKETS: (...buckets: any[]) => Promise<(tokenParser.TokenObject & {
        _id: any[];
        VALUE: tokenParser.RangeObject;
    })[]>;
    CREATED: () => any;
    DISTINCT: (...tokens: any[]) => Promise<any[]>;
    EXIST: (...ids: any[]) => Promise<any>;
    EXPORT: EXPORT;
    FACETS: (...tokens: any[]) => Promise<any[]>;
    FIELDS: () => Promise<any>;
    GET: GET;
    INTERSECTION: INTERSECTION;
    LAST_UPDATED: () => any;
    MAX: (fieldName: any) => Promise<any>;
    MIN: (token: any, reverse: any) => Promise<any>;
    OBJECT: (_ids: any) => Promise<any>;
    SET_SUBTRACTION: SET_SUBTRACTION;
    SORT: (results: any) => Promise<any>;
    UNION: UNION;
    parseToken: (token: import("./parseToken").Token) => Promise<import("./parseToken").TokenObject>;
};
declare namespace read {
    export { KeyValueObject, RangeOptions, EXPORT, AlterToken, MatchObject, QueryObject, GET, UnionQueryObject, UNION, INTERSECTION, SET_SUBTRACTION };
}
import tokenParser = require("./parseToken");
/**
 * Exports the index
 */
type EXPORT = (options?: RangeOptions) => Promise<KeyValueObject[]>;
/**
/**
 * Returns all objects that match the query clause
 */
type GET = (token: import("./parseToken.js").Token, pipeline?: AlterToken) => Promise<QueryObject[]>;
/**
 * Returns objects that match every clause in the query
 */
type INTERSECTION = (tokens: import("./parseToken.js").Token[], pipeline?: AlterToken) => Promise<QueryObject[]>;
/**
 */
/**
 * Returns objects that are present in A, but not in B
 */
type SET_SUBTRACTION = (a: import("./parseToken.js").Token, b: import("./parseToken.js").Token) => Promise<QueryObject[]>;
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
