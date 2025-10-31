/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * JSON Web Key Set
 */
export type JWKSResponse = {
  keys?: Array<{
    /**
     * Key type.
     */
    kty?: string;
    /**
     * Key use.
     */
    use?: string;
    /**
     * Key ID.
     */
    kid?: string;
    /**
     * Algorithm.
     */
    alg?: string;
    /**
     * RSA modulus.
     */
    'n'?: string;
    /**
     * RSA exponent.
     */
    'e'?: string;
  }>;
};

