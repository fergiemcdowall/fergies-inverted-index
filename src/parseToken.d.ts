export = parseToken;
/**
 * @type {PARSE}
 */
declare const parseToken: PARSE;
declare namespace parseToken {
    export { AND, NOT, OR, SEARCH, QueryVerb, Field, RangeObject, FieldValueObject, Token, TokenObject, PARSE };
}
/**
 * Turns `key` into JSON object that is of the format `{FIELD: ..., VALUE: {GTE: ..., LTE ...}}`
 */
type PARSE = (token: Token, availableFields?: string[]) => Promise<TokenObject>;
type AND = {
    AND: Token[];
};
type NOT = {
    INCLUDE: Token;
    EXCLUDE: Token;
};
type OR = {
    OR: Token[];
};
type SEARCH = {
    SEARCH: Token[];
};
type QueryVerb = AND | NOT | OR | SEARCH;
type Field = string | string[];
type RangeObject = {
    GTE: string | number;
    LTE: string | number;
};
type FieldValueObject = {
    FIELD: Field;
    VALUE?: string | RangeObject;
};
type Token = Field | FieldValueObject | QueryVerb;
type TokenObject = {
    FIELD: Field;
    VALUE: RangeObject;
};
