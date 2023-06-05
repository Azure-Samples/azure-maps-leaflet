export const Constants = {
    // Enable localStorage for IE, as sessionStorage does not work for localhost.
    preferredCacheLocation: "localStorage",
    storage: {
        accessTokenKey: "access.token.key",
        testStorageKey: "testStorage"
    },
    events: {
        tokenAcquired: "tokenacquired"
    },
    tokenExpiresIn: 3599,
    tokenRefreshClockSkew: 300,
    errors: {
        tokenExpired: "Token Expired, Try again"
    },
    AUTHORIZATION: "authorization",
    AUTHORIZATION_SCHEME: "Bearer",
    AUTHORIZATION_SCHEME_SAS: "jwt-sas",
    MAP_AGENT: "Map-Agent",
    MS_AM_REQUEST_ORIGIN: "Ms-Am-Request-Origin",
    MS_AM_REQUEST_ORIGIN_VALUE: "MapControl",
    X_MS_CLIENT_ID: "x-ms-client-id",
    SESSION_ID: "Session-Id",
    SHORT_DOMAIN: 'atlas.microsoft.com',
    DEFAULT_DOMAIN: 'https://atlas.microsoft.com/',
    SDK_VERSION: '0.0.1',
    TARGET_SDK: 'Leaflet',
    RENDERV2_VERSION: '2.1'
};