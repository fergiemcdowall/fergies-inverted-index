export = parseToken;
/**
 * Turns `key` into JSON object that is of the format `{FIELD: ..., VALUE: {GTE: ..., LTE ...}}`
 * @param {Token} token
 * @param {string[]} [availableFields]
 * @returns {Promise<TokenObject>} `token` parsed into JSON object
 */
declare function parseToken(token: Token, availableFields?: string[]): Promise<TokenObject>;
declare namespace parseToken {
    export { AND, NOT, OR, SEARCH, QueryVerb, Field, RangeObject, FieldValueObject, Token, TokenObject };
}
type Token = Field | FieldValueObject | QueryVerb;
type TokenObject = {
    FIELD: Field;
    VALUE: RangeObject;
};
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
