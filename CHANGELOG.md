## azure-maps-leaflet Changelog

<a name="0.0.1"></a>
# 0.0.1 (2021-01-12)

Initial release.

**Features**

- Authenticate using an Azure Maps subscription key or Azure Active Directory.
- Works with with Azure Public and Government clouds.
- [Supports over 30 languages](https://docs.microsoft.com/azure/azure-maps/supported-languages)
- Supported layers:
    - **Road maps**
        - Main (`microsoft.base.road`) - All layers with our main style.
        - Labels (`microsoft.base.labels.road`) - Label data in our main style.
        - Hybrid (`microsoft.base.hybrid.road`) - Road, boundary and label data in our main style.
        - Dark grayscale (`microsoft.base.darkgrey`) - All layers with our dark grayscale style.
    - **Imagery** (`microsoft.imagery`)
    - **Traffic Flow**
        - absolute (`microsoft.traffic.flow.absolute`)
        - reduced-sensitivity (`microsoft.traffic.flow.reduced-sensitivity`)
        - relative (`microsoft.traffic.flow.relative`)
        - relative-delay (microsoft.traffic.flow.relative-delay`)
    - **Traffic Incident**
        - night (`microsoft.traffic.incident.night`)
        - s1 (`microsoft.traffic.incident.s1`)
        - s2 (`microsoft.traffic.incident.s2`)
        - s3 (`microsoft.traffic.incident.s3`)
    - **Weather**
        - Infrared (`microsoft.weather.infrared.main`) - Latest Infrared Satellite images shows clouds by their temperature. 
        - Radar (`microsoft.weather.radar.main`) - Latest weather radar images including areas of rain, snow, ice and mixed conditions. 

