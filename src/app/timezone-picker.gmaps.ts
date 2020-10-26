
/**
 * Wrapper class around google maps API
 */
class GoogleMapsWrapper extends TimezonePickerMapper {
    private _map: google.maps.Map;
    private _lastInfoWindow: google.maps.InfoWindow = null;

    constructor(el: HTMLElement, mouseClickHandler: (...args: any[]) => void, mouseMoveHandler: (...args: any[]) => void, mapOptions: {}) {
        super(el, mouseClickHandler, mouseMoveHandler, mapOptions);
        // Append gmaps specific options
        mapOptions['mapTypeId'] = google.maps.MapTypeId.ROADMAP;
        mapOptions['center'] = new google.maps.LatLng(mapOptions['centerLat'], mapOptions['centerLng']);

        // Create new map instace with speicifc options
        this._map = new google.maps.Map(el, mapOptions);

        // Hook events
        google.maps.event.addListener(this._map, 'click', mouseClickHandler);
        if (mouseMoveHandler)
            google.maps.event.addListener(this._map, 'mousemove', mouseMoveHandler);
    }

    AddPolygon(coords: TimezonePickerCoordinate[], stroke: TimezonePickerStroke, fill: TimezonePickerFill, clickHandler: (...args: any[]) => void, moveHandler: (...args: any[]) => void): TimezonePickerPolygon {
        // Spawn gmaps polygon
        const polygon = new google.maps.Polygon({
            paths: coords,
            strokeColor: stroke.color,
            strokeOpacity: stroke.opacity,
            strokeWeight: stroke.width,
            fillColor: fill.color,
            fillOpacity: fill.opacity
        });

        // Add it to map
        polygon.setMap(this._map);

        // Register listener
        google.maps.event.addListener(polygon, 'click', clickHandler);
        if (moveHandler)
            google.maps.event.addListener(polygon, 'mousemove', moveHandler);

        return polygon;
    }

    CreatePoint(lat: number, lng: number) {
        return new google.maps.LatLng(lat, lng);
    }

    RemovePolygon(polygon: TimezonePickerPolygon): void {
        if (polygon) {
            (<google.maps.Polygon>polygon).setMap(null);
        }
    }

    ShowInfoWindow(position: TimezonePickerCoordinate, content: string, callback: () => void): void {
        var window = new google.maps.InfoWindow({
            content: `
                <div id="timezone_picker_infowindow" class="timezone-picker-infowindow">
                    ${content}
                </div>
                `
        });

        // TODO: Check for lambda function context
        google.maps.event.addListener(window, 'domready', () => {
            var infoWindow = document.querySelector('#timezone_picker_infowindow');

            // Call callback in infowindow context
            if (callback)
                callback.bind(infoWindow)();
        });

        window.setPosition(position);
        window.open(this._map);

        this._lastInfoWindow = window;
    }


    HideInfoWindow(): void {
        if (this._lastInfoWindow)
            this._lastInfoWindow.close();
    }
}
