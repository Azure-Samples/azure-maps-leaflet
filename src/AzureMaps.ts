import L from 'leaflet';
import { AzureMapsTileLayerOptions } from './AzureMapsTileLayerOptions';
import { AuthenticationManager } from './internal/AuthenticationManager';
import { Constants } from './internal/Constants';

const _renderV2TileUrl = 'https://{azMapsDomain}/map/tile?api-version=2.0&tilesetId={tilesetId}&zoom={z}&x={x}&y={y}&tileSize={tileSize}&language={language}&view={view}';
const _trafficFlowTileUrl = 'https://{azMapsDomain}/traffic/flow/tile/png?api-version=1.0&style={style}&zoom={z}&x={x}&y={y}';
const _trafficIncidentTileUrl = 'https://{azMapsDomain}/traffic/incident/tile/png?api-version=1.0&style={style}&zoom={z}&x={x}&y={y}';

/**
 * A tile layer that connects to the Azure Maps Render V2 service.
 */
export class AzureMaps extends L.TileLayer {

    /************************
     * Private properties
     ***********************/

    private _authManager: AuthenticationManager;
    private _baseUrl: string = _renderV2TileUrl;

    /************************
     * Constructor
     ***********************/

    /**
     * A tile layer that connects to the Azure Maps Render V2 service.
     * @param options Azure Maps Tile layer options.
     */
    constructor(options: AzureMapsTileLayerOptions) {
        super(_renderV2TileUrl, Object.assign({
            tileSize: 256,
            language: 'en-US',
            view: 'Auto'
        }, options));

        const self = this;
        const opt = <AzureMapsTileLayerOptions>self.options;
        const au = opt.authOptions;

        if (!au) {
            throw 'Azure Maps credentials not specified.';
        }

        if(!au.azMapsDomain){
            au.azMapsDomain = Constants.SHORT_DOMAIN;
        }

        const am = AuthenticationManager.getInstance(au);
        self._authManager = am;

        if (!am.isInitialized()) {
            am.initialize().then(() => {
                self.setTilesetId(opt.tilesetId || 'microsoft.base.road');
            });
        } else {
            /* self._source = new AzureMapsTileSource(MapsURL.newPipeline(authOptions, {
                    retryOptions: { maxTries: 4 }, // Retry options
                }), (<AzureMapsTileLayerOptions>self.options).azMapsDomain);*/
            self.setTilesetId(opt.tilesetId || 'microsoft.base.road');
        }
    }

    /************************
     * Public functions
     ***********************/

    /**
     * Gets the attributions for the tile layer.
     */
    public getAttribution(): string {
        const self = this;
        const ts = (<AzureMapsTileLayerOptions>self.options).tilesetId;
        var partner: string;
        var attr = self.options.attribution;

        if (ts) {
            if (ts.startsWith('microsoft.base.') || ts.startsWith('microsoft.traffic.')) {
                partner = 'TomTom';
            } else if (ts.startsWith('microsoft.weather.')) {
                partner = 'AccuWeather';
            } else if (ts === 'microsoft.imagery') {
                partner = 'DigitalGlobe';
            }

            if (partner) {
                return `© ${new Date().getFullYear()} ${partner}, Microsoft`;
            } else if (!attr) {
                return `© ${new Date().getFullYear()} Microsoft`;
            }
        }

        return attr;
    }

    /**
     * Gets the tile URL for the specified map tile coordinates.
     * @param coords Map tile coordinates.
     */
    public getTileUrl(coords: L.Coords): string {
        const self = this;
        const opt = <AzureMapsTileLayerOptions>self.options;
        return self._getFormattedUrl()
            .replace('{x}', coords.x.toString())
            .replace('{y}', coords.y.toString())
            .replace('{z}', self._getZoomForUrl().toString());
    }

    /**
     * Creates a map tile for the layer.
     * @param coords Map tile coordinates.
     * @param done Callback function for when the map tile has finished loading.
     */
    public createTile(coords: L.Coords, done: L.DoneCallback) {
        const self = this;

        const img = document.createElement("img");
        img.setAttribute("role", "presentation");

        if ((<AzureMapsTileLayerOptions>self.options).tilesetId) {
            self._authManager.getRequest(self.getTileUrl(coords)).then(r => {
                r.blob().then(blobResponse => {
                    const reader = new FileReader();
                    reader.onload = () => {
                        img.src = <string>reader.result;
                        img.style.visibility = 'visible';
                        done();
                    };
                    reader.readAsDataURL(blobResponse);
                });
            });
        }

        return img;
    }

    /** Gets the geopolitical view setting of the layer. */
    public getView(): string {
        return (<AzureMapsTileLayerOptions>this.options).view;
    }

    /** Gets the language code used by the layer. */
    public getLanguage(): string {
        return (<AzureMapsTileLayerOptions>this.options).language;
    }

    /**
     * Sets the language code to append to the request.
     * @param language The language code to set.
     */
    public setLanguage(language: string): void {
        //@ts-ignore
        this.options.language = language;
        this._refresh();
    }

    /** Gets the tileset ID of the layer. */
    public getTilesetId(): string {
        return (<AzureMapsTileLayerOptions>this.options).tilesetId;
    }

    /**
     * Sets the tileset ID of the layer.
     * @param tilesetId The tileset to change to.
     */
    public setTilesetId(tilesetId: string): void {
        const self = this;
        (<AzureMapsTileLayerOptions>self.options).tilesetId = tilesetId;

        self._baseUrl = _renderV2TileUrl;

        if(tilesetId.startsWith('microsoft.traffic.flow')){
            self._baseUrl = _trafficFlowTileUrl;
        } else if(tilesetId.startsWith('microsoft.traffic.incident')) {
            self._baseUrl = _trafficIncidentTileUrl;
        }

        self._refresh();
    }

    /**
     * Gets the time stamp value setting.
     */
    public getTimeStamp(): string | Date {
        return (<AzureMapsTileLayerOptions>this.options).timeStamp;
    }

    /**
     * Sets the time stamp option of the request.
     * @param timeStamp Time stamp value.
     */
    public setTimeStamp(timeStamp: string | Date): void {
        (<AzureMapsTileLayerOptions>this.options).timeStamp = timeStamp;
        this._refresh();
    }

    /************************
     * Private functions
     ***********************/

    private _refresh(): void {
        super.setUrl(this._getFormattedUrl());
    }

    private _getFormattedUrl(): string {
        const self = this;
        const opt = <AzureMapsTileLayerOptions>self.options;

        var url = self._baseUrl
            .replace('{tileSize}', self._getTileSize().toString())
            .replace('{language}', opt.language)
            .replace('{view}', opt.view)
            .replace('{tilesetId}', opt.tilesetId);

        if(opt.tilesetId.startsWith('microsoft.traffic')){
            url = url.replace('{style}', self._getTrafficStyle());
        }

        if (opt.timeStamp) {
            var ts = <string>opt.timeStamp;

            if (opt.timeStamp instanceof Date) {
                //Create an ISO 8601 timestamp string.
                //JavaScripts format for ISO string includes decimal seconds and the letter "Z" at the end that is not supported. Use slice to remove this.
                ts = opt.timeStamp.toISOString().slice(0, 19);
            }

            url = url.replace('{timeStamp}', ts);
        }

        return url;
    }

    private _getTileSize(): number {
        const ts = this.options.tileSize;
        return (typeof ts === 'number') ? ts : ts.x;
    }

    private _getTrafficStyle(): string {
        switch((<AzureMapsTileLayerOptions>this.options).tilesetId){
            case 'microsoft.traffic.incident.night':
                return 'night';
            case 'microsoft.traffic.incident.s1':
                return 's1';
            case 'microsoft.traffic.incident.s2':
                return 's2';
            case 'microsoft.traffic.incident.s3':
                return 's3';
            case 'microsoft.traffic.flow.absolute':
                return 'absolute';
            case 'microsoft.traffic.flow.reduced-sensitivity':
                return 'reduced-sensitivity';
            case 'microsoft.traffic.flow.relative':
                return 'relative';
            case 'microsoft.traffic.flow.relative-delay':
                return 'relative-delay';
        }

        return null;
    }
}