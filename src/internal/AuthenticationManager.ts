import { AuthenticationOptions } from './../AuthenticationOptions';
import AuthenticationContext from 'adal-angular';
import { RequestParameters } from './RequestParameters';
import { AuthenticationType } from './AuthenticationType';
import { Constants } from './Constants';
import { Helpers } from './Helpers';
import { Timers } from './Timers';

/**
 * A manager for the map control's authentication.
 * Exposed through the authentication property of the atlas.Map class.
 * Cannot be instantiated by the user.
 */
export class AuthenticationManager {
    private readonly options: AuthenticationOptions;
    private tokenTimeOutHandle: number; // Anon auth token refresh timeout
    private initPromise: Promise<void>;
    private _initialized = false;
    
    private static fallbackStorage: Record<string, string> = {};

    private static instance: AuthenticationManager;
    public static readonly sessionId = Helpers.uuid();

    public static getInstance(authOptions: AuthenticationOptions): AuthenticationManager {
        if (authOptions && authOptions.authType) {
            const domain = authOptions.azMapsDomain;
            //Remove any domain that might be in the domain.
            if (domain && /^\w+:\/\//.test(domain)) {
                // If the provided url includes a protocol don't change it.
                authOptions.azMapsDomain = domain.replace(/^\w+:\/\//, '');
            }

            if (AuthenticationManager.instance && AuthenticationManager.instance.compareOptions(authOptions)) {
                return AuthenticationManager.instance;
            }

            const au = new AuthenticationManager(authOptions);

            //Cache the instance for faster processing of additional layers and allow reuse of the same instance.
            if (!AuthenticationManager.instance){
                AuthenticationManager.instance = au;
            }

            return au;
        }

        if (AuthenticationManager.instance) {
            return AuthenticationManager.instance;
        }

        throw 'Azure Maps credentials not specified.';
    }

    public compareOptions(authOptions: AuthenticationOptions): boolean {
        const opt = this.options;

        return authOptions.azMapsDomain === opt.azMapsDomain &&
            authOptions.aadAppId === opt.aadAppId &&
            authOptions.aadInstance === opt.aadInstance &&
            authOptions.aadTenant === opt.aadTenant &&
            authOptions.authType === opt.authType &&
            authOptions.clientId === opt.clientId &&
            authOptions.getToken === opt.getToken &&
            authOptions.subscriptionKey === opt.subscriptionKey;
    }

    /**
     * A static auth context shared between maps that don't have one specified to them.
     */
    private static defaultAuthContext: AuthenticationContext;

    /**
     * @internal
     */
    constructor(authOptions: AuthenticationOptions) {
        this.options = authOptions;
    }

    public isInitialized(): boolean {
        return this._initialized;
    }

    /**
     * Initializes the authentication mechanism specified in AuthenticationOptions.
     * If this method has been called before the original initialize promise is returned.
     */
    public initialize(): Promise<void> {
        const self = this;
        const opt = self.options;

        if (!self.initPromise) {
            // If an init promise hasn't been created this is the first initialize call.
            self.initPromise = new Promise((resolve, reject) => {
                if (opt.authType === AuthenticationType.subscriptionKey) {
                    self._initialized = true;
                    resolve();                    
                } else if (opt.authType === AuthenticationType.aad) {
                    // If a specific auth context was provided to the map use that.
                    // If not use/create a default auth context shared between maps.
                    opt.authContext = opt.authContext ||
                        AuthenticationManager.getDefaultAuthContext(opt);

                    // If this window is a callback then it is the hidden iframe created by ADAL.
                    // The map doesn't need to finish constructing, so we can dispose it.
                    opt.authContext.handleWindowCallback();
                    if (opt.authContext.getLoginError()) {
                        reject(new Error("Error logging in the AAD users: " +
                        opt.authContext.getLoginError()));
                        return;
                    }

                    if (opt.authContext.isCallback(window.location.hash)) {
                        return;
                    }

                    // Login and acquire a token.
                    // Fire it async so that users can add any listeners for token acquire events first.
                    Timers.setTimeout(() => self._loginAndAcquire(resolve, reject), 0);
                } else if (opt.authType === AuthenticationType.anonymous || opt.authType === AuthenticationType.sas) {
                    // Anonymous authentication, just call the users provided callback.
                    self._initialized = true;
                    resolve(self._triggerTokenFetch());
                } else {
                    reject(new Error("An invalid authentication type was specified."));
                }
            });
        }

        return this.initPromise;
    }

    /**
     * Gets the default auth context to be shared between maps without one specified to them.
     */
    private static getDefaultAuthContext(options: AuthenticationOptions): AuthenticationContext {
        const self = this;
        if (!options.aadAppId) {
            throw new Error("No AAD app ID was specified.");
        }

        if (!options.aadTenant) {
            throw new Error("No AAD tenant was specified.");
        }

        // Create a new auth context if one doesn't already exist.
        if (!self.defaultAuthContext) {
            self.defaultAuthContext = new AuthenticationContext({
                instance: options.aadInstance || 'https://login.windows-ppe.net/',
                tenant: options.aadTenant,
                clientId: options.aadAppId,
                cacheLocation: Constants.preferredCacheLocation as ("localStorage" | "sessionStorage")
            });
        }

        // Return either a reused auth context or the one created just above.
        return self.defaultAuthContext;
    }

    /**
     * The login callback function, called after user interactive login session is completed
     * @param resolve the resolve callback for the promise created from the initialize call
     */
    private _loginAndAcquire(resolve: () => void, reject: (reason?: any) => void) {
        const self = this;
        const opt = self.options;

        const acquireAndResolve = () => {
            // Check that we can acquire a token and then resolve the promise.
            // Reject if an error occurs when acquiring the token.
            opt.authContext.acquireToken(Constants.DEFAULT_DOMAIN, (error: string) => {
                if (error) {
                    reject(new Error(error));
                } else {
                    self._initialized = true;
                    resolve();
                }
            });
        };

        const cachedToken = opt.authContext.getCachedToken(opt.aadAppId);
        const cachedUser = opt.authContext.getCachedUser();

        if (cachedToken && cachedUser) {
            // If a cached token and user are available we should be able to
            // acquire the access token and then resolve the promise.
            acquireAndResolve();
        } else {
            // If a login isn't already in progress start a new one.
            if (!opt.authContext.loginInProgress()) {
                opt.authContext.login();
            }

            // Poll for when the login done and then use the cached token.
            const loginPoll = setInterval(() => {
                if (!opt.authContext.loginInProgress()) {
                    // Stop polling for login done.
                    clearInterval(loginPoll);
                    if (opt.authContext.getCachedToken(opt.aadAppId)) {
                        // If a token for the specified AAD app id is available we are ready
                        // to acquire the access token and resolve the init promise.
                        acquireAndResolve();
                    } else {
                        // If done logging in but no token for the specified AAD app ID is cached
                        // then there is a mistake in the auth context config.
                        reject(new Error(opt.authContext.getLoginError() ||
                            "The AAD authentication context is not logged-in for the specified app ID: " +
                            opt.aadAppId));
                    }
                }
            }, 25);
        }
    }

    /**
     * Returns the current authentication type in use.
     */
    public getAuthType(): AuthenticationType {
        return this.options.authType;
    }

    /**
     * Returns the current client ID in use.
     */
    public getClientId(): string {
        return this.options.clientId;
    }

    /**
     * Returns the access token with an audience URI of https://atlas.microsoft.com.
     */
    public getToken(): string {
        const self = this;
        const opt = self.options;

        if (opt.authType === AuthenticationType.aad) {
            let token = opt.authContext.getCachedToken(Constants.DEFAULT_DOMAIN);
            if (!token) {
                if (!opt.authContext.getCachedUser()) {
                    // Login if a user isn't cached. This shouldn't typically happen.
                    opt.authContext.login();
                }

                opt.authContext.acquireToken(Constants.DEFAULT_DOMAIN, (error, renewedToken) => {
                    if (!error) {
                        token = renewedToken;
                    }
                });
            }

            return token;
        } else if (opt.authType === AuthenticationType.anonymous || opt.authType === AuthenticationType.sas) {
            const token = self._getItem(Constants.storage.accessTokenKey);
            if (!token) {
                // Cached Token not present, invoke the user provided callback function to fetch function
                self._triggerTokenFetch();
            } else {
                // check for cached token validity
                const expiresIn = self._getTokenExpiry(token);
                if (expiresIn < 300 && expiresIn > 0) {
                    // We are within a window for the token expiry,
                    // trigger a new token fetch, but still return the current token
                    self._triggerTokenFetch();
                } else if (expiresIn <= 0) {
                    // Token renew failed and don't have a token.
                    // Try fetching a new token.
                    self._triggerTokenFetch();
                   // self._saveItem(Constants.storage.accessTokenKey, "");
                  //  throw new Error(Constants.errors.tokenExpired);
                } else {
                    //Add a timeout to renew the cached token. 
                    // Try to get the timeout first as this will guarantee the token is correctly formatted.
                    const timeout = expiresIn - Constants.tokenRefreshClockSkew;

                    Timers.clearTimeout(self.tokenTimeOutHandle); // Clear the previous refresh timeout in case it hadn't triggered yet.
                    //@ts-ignore
                    self.tokenTimeOutHandle = Timers.setTimeout(self._triggerTokenFetch, timeout);
                }
            }

            return token;
        } else if (opt.authType === AuthenticationType.subscriptionKey) {
            return opt.subscriptionKey;
        }
    }

    /**
     * Triggers the user provided function to fetch the token and stores it.
     * @internal
     */
    private _triggerTokenFetch = () => {
        const self = this;
        return new Promise<void>((resolve, reject) => {
            self.options.getToken((token) => {
                try {
                    // Try to get the timeout first as this will guarantee the token is correctly formatted.
                    const timeout = self._getTokenExpiry(token) - Constants.tokenRefreshClockSkew;

                    self._storeAccessToken(token);
                    Timers.clearTimeout(self.tokenTimeOutHandle); // Clear the previous refresh timeout in case it hadn't triggered yet.
                    //@ts-ignore
                    self.tokenTimeOutHandle = Timers.setTimeout(self._triggerTokenFetch, timeout);

                    resolve();
                } catch {
                    reject(new Error(`Invalid token returned by getToken function`));
                }
            }, (error) => {
                reject(error);
            });
        });
    }

    /**
     * Given a token, calculate the time left for token expiry in ms.
     * @param token
     * @internal
     */
    private _getTokenExpiry(token: string): number {
       /* const decodedToken = jwt_decode<{ exp: number }>(token);
        const expiresIn = decodedToken.exp;
        const now = this._getCurrentTime();
        return expiresIn - now > 0 ? expiresIn - now : -1;*/
        // Decode the JWT token to get the expiration timestamp
        const json = atob(token.split(".")[1]);
        const decode = JSON.parse(json);

        // Return the milliseconds until the token needs renewed
        // Reduce the time until renew by 5 minutes to avoid using an expired token
        // The exp property is the timestamp of the expiration in seconds
        const renewSkew = 300000;
        return (1000 * decode.exp) - Date.now() - renewSkew;
    }

    /**
     * stores the token
     * @param token token fetched from the user's server endpoint
     * @internal
     */
    private _storeAccessToken(token: string) {
        // Store the value
        this._saveItem(Constants.storage.accessTokenKey, token);
    }

    /**
     * Saves the item to storage
     * @param key key/identifier
     * @param value value to be stored
     */
    private _saveItem(key: string, value: any): boolean {
        if (this._supportsLocalStorage()) {
            localStorage.setItem(key, value);
            return true;
        } else if (this._supportsSessionStorage()) {
            sessionStorage.setItem(key, value);
            return true;
        } else {
            AuthenticationManager.fallbackStorage[key] = value;
            return true;
        }

        return false;
    }

    /**
     * Gets an item saved in storage
     * @param key Key/Identifier to be used for lookup
     */
    private _getItem(key: string): string {
        if (this._supportsLocalStorage()) {
            return localStorage.getItem(key);
        } else if (this._supportsSessionStorage()) {
            return sessionStorage.getItem(key);
        } else {
            return AuthenticationManager.fallbackStorage[key];
        }


        return null;
    }

    /**
     * Returns true if browser supports localStorage, false otherwise.
     * @ignore
     */
    private _supportsLocalStorage(): boolean {
        try {
            const wls = window.localStorage;
            const testStorageKey = Constants.storage.testStorageKey;
            if (!wls) { return false; } // Test availability
            wls.setItem(testStorageKey, "A"); // Try write
            if (wls.getItem(testStorageKey) !== "A") { return false; } // Test read/write
            wls.removeItem(testStorageKey); // Try delete
            if (wls.getItem(testStorageKey)) { return false; } // Test delete
            return true; // Success
        } catch (e) {
            return false;
        }
    }

    /**
     * Returns true if browser supports sessionStorage, false otherwise.
     * @ignore
     */
    private _supportsSessionStorage(): boolean {
        try {
            const wss = window.sessionStorage;
            const testStorageKey = Constants.storage.testStorageKey;
            if (!wss) { return false; } // Test availability
            wss.setItem(testStorageKey, "A"); // Try write
            if (wss.getItem(testStorageKey) !== "A") { return false; } // Test read/write
            wss.removeItem(testStorageKey); // Try delete
            if (wss.getItem(testStorageKey)) { return false; } // Test delete
            return true; // Success
        } catch (e) {
            return false;
        }
    }
    
    public signRequest(request: RequestParameters): RequestParameters {
        const self = this;
        const opt = self.options;
        const h = Constants;
        
        request.url = request.url.replace('{azMapsDomain}', opt.azMapsDomain);

        // Add the headers used for identifying a request is from the map control.
        var headers = request.headers || {};
        headers[h.SESSION_ID] = AuthenticationManager.sessionId;
        headers[h.MS_AM_REQUEST_ORIGIN] = h.MS_AM_REQUEST_ORIGIN_VALUE;
        headers[h.MAP_AGENT] = `MapControl/${h.SDK_VERSION} (${h.TARGET_SDK})`;

        const token = self.getToken();
        switch (opt.authType) {
            case AuthenticationType.aad:
            case AuthenticationType.anonymous:
                headers[h.X_MS_CLIENT_ID] = opt.clientId;
                headers[h.AUTHORIZATION] = `${h.AUTHORIZATION_SCHEME} ${token}`;
                break;
            case AuthenticationType.sas:
                headers[h.X_MS_CLIENT_ID] = opt.clientId;
                headers[h.AUTHORIZATION] = `${h.AUTHORIZATION_SCHEME_SAS} ${token}`;
                break;
            case AuthenticationType.subscriptionKey:
                if ("url" in request) {                   
                    var prefix = '?';
                    
                    if (request.url.indexOf("?") !== -1) {
                        prefix = '&';
                    }

                    request.url += `${prefix}subscription-key=${token}`;
                } else {
                    throw new Error("No URL specified in request.");
                }
                break;
            default:
                throw new Error("An invalid authentication type was specified");
        }

        request.headers = headers;

        return request;
    }

    public getRequest(url: string): Promise<Response> {
        const request = this.signRequest({ url: url });

        //Proces the request.
        return fetch(request.url, {
            method: 'GET',
            mode: 'cors',
            headers: new Headers(<Record<string, string>>request.headers)
        });
    }
}
