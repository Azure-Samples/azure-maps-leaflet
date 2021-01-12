import AuthenticationContext from 'adal-angular';
import { AuthenticationType } from './internal/AuthenticationType';

/**
 * The callback function used to acquire an authentication token in anonymous authentication mode.
 * Resolve with the authentication token or reject with any errors.
 */
export type getAuthTokenCallback = (resolve: (value?: string) => void, reject: (reason?: any) => void) => void;

/**
 * Options for specifying how the map control should authenticate with the Azure Maps services.
 */
export interface AuthenticationOptions {   
    /** A URL string pointing to the domain of the Azure Maps service, default is `"atlas.microsoft.com"`. */
    azMapsDomain?: string;

    /**
     * The authentication mechanism to be used.
     */
    authType?: AuthenticationType;

    /**
     * Subscription key from your Azure Maps account.
     * Must be specified for subscription key authentication type.
     */
    subscriptionKey?: string;

    /**
     * The Azure Maps client ID, This is an unique identifier used to identify the maps account.
     * Preferred to always be specified, but must be specified for AAD and anonymous authentication types.
     */
    clientId?: string;

    /**
     * The Azure AD registered app ID. This is the app ID of an app registered in your Azure AD tenant.
     * Must be specified for AAD authentication type.
     */
    aadAppId?: string;

    /**
     * The AAD tenant that owns the registered app specified by `aadAppId`.
     * Must be specified for AAD authentication type.
     */
    aadTenant?: string;

    /**
     * The AAD instance to use for logging in.
     * Can be optionally specified when using the AAD authentication type.
     * By default the `https://login.microsoftonline.com/` instance will be used.
     */
    aadInstance?: string;

    /**
     * A callback to use with the anonymous authentication mechanism.
     * This callback will be responsible for resolving to a authentication token.
     * E.g. fetching a CORS protected token from an endpoint.
     */
    getToken?: getAuthTokenCallback;

    /**
     * Optionally provide an existing `AuthenticationContext` from the ADAL.js library.
     * This authentication context will be used to acquire the AAD token.
     * Only used with the AAD authentication type.
     * This auth context must be configured to use the same AAD app ID as `this.aadAppId`.
     * If this is not provided all map instances will share their own private auth context.
     */
    authContext?: AuthenticationContext;
}
