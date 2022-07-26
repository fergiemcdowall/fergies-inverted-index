declare function _exports(ops: any): {
    DELETE: (_ids: any) => Promise<any>;
    IMPORT: (index: any) => any;
    PUT: (docs: any, putOptions?: {}) => Promise<any>;
    TIMESTAMP_CREATED: () => any;
    TIMESTAMP_LAST_UPDATED: (passThrough: any) => any;
};
export = _exports;
