/**
 * An enumeration used to specify the type of authentication mechanism to use.
 */
export enum AuthenticationType {
    /**
     * The subscription key authentication mechanism.
     * Literal value `"subscriptionKey"`
     */
    subscriptionKey = "subscriptionKey",

    /**
     * The AAD implicit grant mechanism. Recommended for pages protected by a sign-in.
     * By default the page will be redirected to the AAD login when the map control initializes.
     * Specify a logged-in `AuthenticationContext` in the `AuthenticationOptions`
     * for greater control over when/how the users signs in.
     * Literal value `"aad"`
     */
    aad = "aad",

    /**
     * The anonymous authentication mechanism. Recommended for pages.
     * Allows a callback responsible for acquiring an authentication token to be provided.
     * Literal value `"anonymous"`
     */
    anonymous = "anonymous",

    /**
     * The anonymous authentication mechanism. Recommended for pages.
     * Allows a callback responsible for acquiring a SAS authentication token to be provided.
     * Literal value `"sas"`
     */
    sas = "sas"
}
