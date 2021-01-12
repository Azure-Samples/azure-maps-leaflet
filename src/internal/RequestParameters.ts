/**
 * This is the object type expected to be returned by the transformRequest callback.
 */
export class RequestParameters {
    /**
     * Used to specify the cross-origin request (CORs) credentials setting. Can be `'same-origin'` or `'include'`.
     */
    public credentials?: string = undefined;

    /**
     * The headers to be sent with the request.
     */
    public headers?: object = undefined;

    /**
     * The url to be requested.
     */
    public url?: string = undefined;

    /**
     * @internal
     */
    constructor(credentials?: string, headers?: object, url?: string) {
        this.credentials = credentials;
        this.headers = headers;
        this.url = url;
    }
}
