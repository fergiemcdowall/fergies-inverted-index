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
    BUCKET: (token: any) => Promise<tokenParser.Parsed & {
        _id: any[];
        VALUE: tokenParser.RangeValue;
    }>;
    BUCKETS: (...buckets: any[]) => Promise<(tokenParser.Parsed & {
        _id: any[];
        VALUE: tokenParser.RangeValue;
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
    parseToken: (token: import("./parseToken").Token) => Promise<import("./parseToken").Parsed>;
};
declare namespace read {
    export { KeyValue, RangeOptions, EXPORT, AlterToken, FieldValue, QueryValue, GET, UnionValue, UNION };
}
import tokenParser = require("./parseToken");
/**
 * Exports the index
 */
type EXPORT = (rangeOps?: RangeOptions) => Promise<KeyValue[]>;
/**
 * Returns all object ids for objects that contain the given property, aggregated by object id.
 */
type GET = (token: import("./parseToken").Token, pipeline?: AlterToken) => Promise<QueryValue[]>;
type UNION = (token: import("./parseToken").Token, pipeline?: AlterToken) => Promise<UnionValue[]>;
type KeyValue = {
    key: any[];
    value: any;
};
type RangeOptions = import("level-read-stream").ReadStreamOptions & import("abstract-level").AbstractIteratorOptions<any, any>;
/**
 * Alters token
 */
type AlterToken = (token: import("./parseToken").Token) => Promise<import("./parseToken").Token>;
type FieldValue = {
    FIELD: string;
    VALUE: any;
    SCORE?: any;
};
type QueryValue = {
    _id: string;
    _matches: FieldValue[];
};
type UnionValue = {
    sumTokensMinusStopwords: number;
    union: QueryValue[];
};
