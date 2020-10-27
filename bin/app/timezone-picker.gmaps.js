class TZGoogleMapsProvider extends TimezonePickerMapper {
    constructor(el, mouseClickHandler, mouseMoveHandler, mapOptions) {
        super(el, mouseClickHandler, mouseMoveHandler, mapOptions);
        this._lastInfoWindow = null;
        mapOptions['mapTypeId'] = google.maps.MapTypeId.ROADMAP;
        mapOptions['center'] = new google.maps.LatLng(mapOptions['centerLat'], mapOptions['centerLng']);
        this._map = new google.maps.Map(el, mapOptions);
        google.maps.event.addListener(this._map, 'click', mouseClickHandler);
        if (mouseMoveHandler)
            google.maps.event.addListener(this._map, 'mousemove', mouseMoveHandler);
    }
    AddPolygon(coords, stroke, fill, clickHandler, moveHandler) {
        const polygon = new google.maps.Polygon({
            paths: coords,
            strokeColor: stroke.color,
            strokeOpacity: stroke.opacity,
            strokeWeight: stroke.width,
            fillColor: fill.color,
            fillOpacity: fill.opacity
        });
        polygon.setMap(this._map);
        google.maps.event.addListener(polygon, 'click', clickHandler);
        if (moveHandler)
            google.maps.event.addListener(polygon, 'mousemove', moveHandler);
        return polygon;
    }
    CreatePoint(lat, lng) {
        return new google.maps.LatLng(lat, lng);
    }
    RemovePolygon(polygon) {
        if (polygon) {
            polygon.setMap(null);
        }
    }
    ShowInfoWindow(position, content, callback) {
        var window = new google.maps.InfoWindow({
            content: `
                <div id="timezone_picker_infowindow" class="timezone-picker-infowindow">
                    ${content}
                </div>
                `
        });
        google.maps.event.addListener(window, 'domready', () => {
            var infoWindow = document.querySelector('#timezone_picker_infowindow');
            if (callback)
                callback.bind(infoWindow)();
        });
        window.setPosition(position);
        window.open(this._map);
        this._lastInfoWindow = window;
    }
    HideInfoWindow() {
        if (this._lastInfoWindow)
            this._lastInfoWindow.close();
    }
}
