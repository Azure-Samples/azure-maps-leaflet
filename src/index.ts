/* Build the structure of the SDK */
import { AzureMaps } from './AzureMaps';
import { AzureMapsTileLayerOptions } from './AzureMapsTileLayerOptions';

//Add the Azure Maps tile layer class to the L.TileLayer namespace.
const TileLayer = {
    AzureMaps: AzureMaps
};

//Add static function for creating Azure Maps tile layer.
const tileLayer = {
    /**
     * Static function to create a tile layer that connects to the Azure Maps Render V2 service.
     * @param options Azure Maps Tile layer options.
     */
    azureMaps: function(options: AzureMapsTileLayerOptions){
        return new AzureMaps(options);
    }
}

//Export.
export { TileLayer, tileLayer };
