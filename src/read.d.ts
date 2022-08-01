export = read;
declare function read(ops: any): {
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
    INTERSECTION: (tokens: any, pipeline: any) => Promise<any>;
    LAST_UPDATED: () => any;
    MAX: (fieldName: any) => Promise<any>;
    MIN: (token: any, reverse: any) => Promise<any>;
    OBJECT: (_ids: any) => Promise<any>;
    SET_SUBTRACTION: (a: any, b: any) => Promise<any>;
    SORT: (results: any) => Promise<any>;
    UNION: UNION;
    parseToken: (token: import("./parseToken").Token) => Promise<import("./parseToken").TokenObject>;
};
declare namespace read {
    export { KeyValueObject, RangeOptions, EXPORT, AlterToken, MatchObject, ResultObject, GET, UnionResultObject, UNION };
}
import tokenParser = require("./parseToken");
/**
 * Exports the index
 */
type EXPORT = (options?: RangeOptions) => Promise<KeyValueObject[]>;
/**
 * Returns all object ids for objects that contain the given property, aggregated by object id.
 */
type GET = (token: import("./parseToken").Token, pipeline?: AlterToken) => Promise<ResultObject[]>;
type UNION = (token: import("./parseToken").Token, pipeline?: AlterToken) => Promise<UnionResultObject[]>;
type KeyValueObject = {
    key: any[];
    value: any;
};
type RangeOptions = import("level-read-stream").ReadStreamOptions & import("abstract-level").AbstractIteratorOptions<any, any>;
/**
 * Alters token
 */
type AlterToken = (token: import("./parseToken").Token) => Promise<import("./parseToken").Token>;
type MatchObject = {
    FIELD: string;
    VALUE: any;
    SCORE?: any;
};
type ResultObject = {
    _id: string;
    _matches: MatchObject[];
};
type UnionResultObject = {
    sumTokensMinusStopwords: number;
    union: ResultObject[];
};
