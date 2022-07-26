declare function _exports(ops: any): {
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
    BUCKET: (token: any) => Promise<any>;
    BUCKETS: (...buckets: any[]) => Promise<any[]>;
    CREATED: () => any;
    DISTINCT: (...tokens: any[]) => Promise<any[]>;
    EXIST: (...ids: any[]) => Promise<any>;
    EXPORT: (rangeOps: any) => Promise<any>;
    FACETS: (...tokens: any[]) => Promise<any[]>;
    FIELDS: () => Promise<any>;
    GET: (token: any, pipeline?: (token: any) => Promise<any>) => Promise<any>;
    INTERSECTION: (tokens: any, pipeline: any) => Promise<{
        _id: any;
        _match: any;
    }[]>;
    LAST_UPDATED: () => any;
    MAX: (fieldName: any) => Promise<any>;
    MIN: (token: any, reverse: any) => Promise<any>;
    OBJECT: (_ids: any) => Promise<any>;
    SET_SUBTRACTION: (a: any, b: any) => Promise<any>;
    SORT: (results: any) => Promise<any>;
    UNION: (tokens: any, pipeline: any) => Promise<{
        sumTokensMinusStopwords: number;
        union: {
            _id: any;
            _match: any;
        }[];
    }>;
    parseToken: (token: any) => Promise<any>;
};
export = _exports;
