import leaflet from 'leaflet';
import AuthenticationContext from 'adal-angular';

declare namespace L {

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
        authType?: 'subscriptionKey' | 'aad' | 'anonymous';

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

    /** Options for an Azure Maps tile layer. */
    export interface AzureMapsTileLayerOptions extends leaflet.TileLayerOptions {
        /** Required. Authentication options for connecting to Azure Maps. */
        authOptions: AuthenticationOptions;

        /** The tile set ID layer to load from the Azure Maps Render V2 service. */
        tilesetId?: string;

        /** Geopolitical view of the map. */
        view?: string;

        /** Language code. [Supported languages](https://docs.microsoft.com/azure/azure-maps/supported-languages) */
        language?: string;

        /** The desired date and time of the requested tile. This parameter must be specified in the standard date-time format (e.g. 2019-11-14T16:03:00-08:00), as defined by ISO 8601. This parameter is only supported when tilesetId parameter is set to `microsoft.weather.infrared.main` or `microsoft.weather.radar.main`. */
        timeStamp?: string | Date;

        /** The thickness of lines when using the traffic flow tilesets. Default: 5 */
        trafficFlowThickness?: number;
    }

    export module Tilelayer {

        /**
         * A tile layer that connects to the Azure Maps Render V2 service.
         */
        export class AzureMaps extends leaflet.TileLayer {

            /************************
             * Constructor
             ***********************/

            /**
             * A tile layer that connects to the Azure Maps Render V2 service.
             * @param options Azure Maps Tile layer options.
             */
            constructor(options: AzureMapsTileLayerOptions);

            /************************
             * Public functions
             ***********************/

            /**
             * Gets the attributions for the tile layer.
             */
            public getAttribution(): string;

            /**
             * Gets the tile URL for the specified map tile coordinates.
             * @param coords Map tile coordinates.
             */
            public getTileUrl(coords: leaflet.Coords): string;

            /**
             * Creates a map tile for the layer.
             * @param coords Map tile coordinates.
             * @param done Callback function for when the map tile has finished loading.
             */
            public createTile(coords: leaflet.Coords, done: leaflet.DoneCallback);

            /** Gets the geopolitical view setting of the layer. */
            public getView(): string;

            /** Sets the geopolitical view setting of the layer. */
            public setView(view: string): void;

            /** Gets the language code used by the layer. */
            public getLanguage(): string;

            /**
             * Sets the language code to append to the request.
             * @param language The language code to set.
             */
            public setLanguage(language: string): void;

            /** Gets the tileset ID of the layer. */
            public getTilesetId(): string;

            /**
             * Sets the tileset ID of the layer.
             * @param tilesetId The tileset to change to.
             */
            public setTilesetId(tilesetId: string): void;

            /**
             * Gets the time stamp value setting.
             */
            public getTimeStamp(): string | Date;

            /**
             * Sets the time stamp option of the request.
             * @param timeStamp Time stamp value.
             */
            public setTimeStamp(timeStamp: string | Date): void;

            /**
             * Gets the traffic flow thickness setting.
             */
            public getTrafficFlowThickness(): number;

            /**
             * sets the traffic flow thickness setting.
             */
            public setTrafficFlowThickness(thickness: number): void;
        }
    }

    export module tilelayer {
        /**
         * Static function to create a tile layer that connects to the Azure Maps Render V2 service.
         * @param options Azure Maps Tile layer options.
         */
        export function azureMaps(options: AzureMapsTileLayerOptions);
    }
}

export = L;