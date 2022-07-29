/* Build the structure of the SDK */
import L from 'leaflet';
import { AzureMaps } from './AzureMaps';
import { AzureMapsTileLayerOptions } from './AzureMapsTileLayerOptions';

/**
 * Static function to create a tile layer that connects to the Azure Maps Render V2 service.
 * @param options Azure Maps Tile layer options.
 */
const azMapLayer = function(options: AzureMapsTileLayerOptions){
    return new AzureMaps(options);
};

/* Extent the Leaflet tile layer functions/classes with static functions for Azure Maps. */

//@ts-ignore
L.TileLayer.azureMaps = azMapLayer;

//@ts-ignore
L.TileLayer.AzureMaps = AzureMaps;

//@ts-ignore
L.tileLayer.azureMaps = azMapLayer;
