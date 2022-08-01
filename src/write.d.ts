export = write;
/**
 * @param {import("./main").FiiOptions & import("./main").InitializedOptions } ops
 */
declare function write(ops: import("./main").FiiOptions & import("./main").InitializedOptions): {
    DELETE: DELETE;
    IMPORT: IMPORT;
    PUT: PUT;
    TIMESTAMP_CREATED: TIMESTAMP_CREATED;
    TIMESTAMP_LAST_UPDATED: TIMESTAMP_LAST_UPDATED;
};
declare namespace write {
    export { OperationObject, DELETE, IMPORT, PutOptions, PUT, TIMESTAMP_CREATED, TIMESTAMP_LAST_UPDATED };
}
/**
 * Deletes all objects in index by `id`
 */
type DELETE = (ids: any[]) => Promise<OperationObject[]>;
/**
 * Imports in an exported index
 */
type IMPORT = (index: import("./read").KeyValueObject[]) => Promise<void>;
/**
 * Adds documents to index
 */
type PUT = (docs: ReadonlyArray<any>, options?: PutOptions) => Promise<OperationObject[]>;
/**
 * Ensures `~CREATED` was set
 */
type TIMESTAMP_CREATED = () => Promise<void>;
/**
 * Ensures `~LAST_UPDATED` was set
 */
type TIMESTAMP_LAST_UPDATED = (passThrough?: any) => Promise<any>;
type OperationObject = {
    /**
     * ID
     */
    _id: any;
    operation: 'PUT' | 'DELETE' | string;
    status: 'CREATED' | 'UPDATED' | 'DELETED' | string;
};
/**
 * PUT options
 */
type PutOptions = {
    /**
     * Array of fields not to index
     */
    doNotIndexField?: string[];
    /**
     * Sets case sensitivity
     */
    caseSensitive?: boolean;
    /**
     * Array of stop words to be stripped using [`stopword`](https://github.com/fergiemcdowall/stopword)
     */
    stopwords?: string[];
    storeVectors?: boolean;
};
