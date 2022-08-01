export = parseToken;
/**
 * Turn key into json object that is of the format `{FIELD: ..., VALUE: {GTE: ..., LTE ...}}`
 * @param {Token} token
 * @param {string[]} [availableFields]
 * @returns {Promise<Parsed>} `token` parsed into JSON object
 */
declare function parseToken(token: Token, availableFields?: string[]): Promise<Parsed>;
declare namespace parseToken {
    export { AND, NOT, OR, SEARCH, QueryVerb, Field, RangeValue, FieldValue, Token, Parsed };
}
type Token = Field | FieldValue | QueryVerb;
type Parsed = {
    FIELD: Field;
    VALUE: RangeValue;
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
type RangeValue = {
    GTE: string | number;
    LTE: string | number;
};
type FieldValue = {
    FIELD: Field;
    VALUE?: string | RangeValue;
};
