class TimezonePickerMapper {
    constructor(el, mouseClickHandler, mouseMoveHandler, mapOptions) {
    }
}
class TimezonePicker {
    constructor(targetElement, options) {
        this._mapper = null;
        this._options = null;
        this._boundingBoxes = [];
        this._zoneCentroids = {};
        this._selectedRegionKey = null;
        this._mapZones = {};
        this._transitions = {};
        this._isLoaded = false;
        this._polygonCache = {};
        this._currentHoverRegion = null;
        this._hoverRegions = {};
        this._hoverPolygons = [];
        this.OnReady = new EventEmitter();
        this.OnHover = new EventEmitter();
        this.OnSelect = new EventEmitter();
        this._options = options || { mapper: null };
        this._options.initialZoom = this._options.initialZoom || 2;
        this._options.initialLat = this._options.initialLat || 0;
        this._options.initialLng = this._options.initialLng || 0;
        this._options.strokeColor = this._options.strokeColor || '#ff0000';
        this._options.strokeWeight = this._options.strokeWeight || 2;
        this._options.strokeOpacity = this._options.strokeOpacity || 0.7;
        this._options.fillColor = this._options.fillColor || '#ffcccc';
        this._options.fillOpacity = this._options.fillOpacity || 0.5;
        this._options.jsonRootUrl = this._options.jsonRootUrl || 'tz_json/';
        this._options.date = this._options.date || new Date();
        if (!this._options.mapOptions)
            this._options.mapOptions = {};
        this._options.mapOptions['zoom'] = this._options.initialZoom;
        this._options.mapOptions['centerLat'] = this._options.initialLat;
        this._options.mapOptions['centerLng'] = this._options.initialLng;
        if (typeof this._options.hoverRegions === 'undefined')
            this._options.hoverRegions = true;
        if (!this._options.mapper)
            throw new Error("Mapper is not specified");
        this._mapper = new this._options.mapper(targetElement, this.MapClickHandler.bind(this), this._options.hoverRegions ? this.MapMouseMoveHandler.bind(this) : null, this._options.mapOptions);
    }
    async InitializeAsync() {
        Utils.BeginLoading();
        try {
            this._boundingBoxes = await Network.GetAsync(this._options.jsonRootUrl + 'bounding_boxes.json');
            for (const box of this._boundingBoxes) {
                for (const zone in box.zoneCentroids) {
                    const centroids = box.zoneCentroids[zone];
                    if (!this._zoneCentroids[zone])
                        this._zoneCentroids[zone] = centroids;
                    else
                        this._zoneCentroids[zone].push(...centroids);
                }
            }
            if (this._options.hoverRegions) {
                let hoverRegions = await Network.GetAsync(this._options.jsonRootUrl + 'hover_regions.json');
                for (const region of hoverRegions) {
                    this._hoverRegions[region.name] = region;
                }
            }
            console.groupCollapsed("Loaded TZ JSON Data");
            console.log("Bounding boxes", this._boundingBoxes);
            console.log("Zone centroids", this._zoneCentroids);
            console.log("Hover regions", this._hoverRegions);
            console.groupEnd();
            this._isLoaded = true;
            this.OnReady.Emit();
        }
        catch (err) {
            console.error(err);
        }
        finally {
            Utils.EndLoading();
        }
    }
    SetDate(date) {
        this.HideInfoWindow();
        this._options.date = date;
    }
    ShowInfoWindow(content) {
        let centroid = null;
        var maxPoints = 0;
        if (this._selectedPolygon.points.length > maxPoints) {
            centroid = this._selectedPolygon.centroid;
            maxPoints = this._selectedPolygon.points.length;
        }
        this.HideInfoWindow();
        this._mapper.ShowInfoWindow(this._mapper.CreatePoint(centroid[1], centroid[0]), content, () => { });
    }
    HideInfoWindow() {
        this._mapper.HideInfoWindow();
    }
    SelectZone(olsonName) {
        const centroid = this._zoneCentroids[olsonName];
        if (centroid) {
            this.MapClickHandler({ latLng: { lat: () => centroid[1], lng: () => centroid[0] } });
        }
    }
    async MapClickHandler(e) {
        if (!this._isLoaded)
            return;
        this.HideInfoWindow();
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        const candidates = [];
        for (const box of this._boundingBoxes) {
            const bb = box.boundingBox;
            if (lat > bb.ymin && lat < bb.ymax && lng > bb.xmin && lng < bb.xmax) {
                candidates.push(this.SlugifyName(box.name));
            }
        }
        this.ClearZones();
        for (const iterator of candidates) {
            await this.DrawZone(iterator, lat, lng);
        }
        this.ClearHover();
        this._currentHoverRegion = null;
    }
    MapMouseMoveHandler(e) {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        for (const box of this._boundingBoxes) {
            const bb = box.boundingBox;
            if (lat > bb.ymin && lat < bb.ymax && lng > bb.xmin && lng < bb.xmax) {
                const hoverRegion = this._hoverRegions[box.name];
                if (!hoverRegion)
                    continue;
                const result = this.HitTestAndConvert(hoverRegion.hoverRegion, lat, lng);
                const slugName = this.SlugifyName(box.name);
                if (result.inZone && slugName != this._currentHoverRegion && slugName != this._selectedRegionKey) {
                    this.ClearHover();
                    this._currentHoverRegion = slugName;
                    for (const polygonInfo of result.allPolygons) {
                        let mapPolygon = this._mapper.AddPolygon(polygonInfo.coords, {
                            color: '#44444',
                            opacity: 0.7,
                            width: 1
                        }, {
                            color: '#888888',
                            opacity: 0.5
                        }, this.MapClickHandler.bind(this), null);
                        this._hoverPolygons.push(mapPolygon);
                    }
                    const transition = this.GetCurrentTransition(hoverRegion.transitions);
                    this.OnHover.Emit(transition[1], transition[2]);
                }
            }
        }
    }
    GetCurrentTransition(transitions) {
        if (transitions.length == 1)
            return transitions[0];
        const now = this._options.date.getTime() / 1000;
        let selected = 0;
        for (let i = 0; i < transitions.length; i++) {
            const transition = transitions[i];
            if (transition[0] < now && i < transitions.length - 1 && transitions[i + 1][0] > now) {
                selected = transition;
            }
        }
        if (!selected)
            selected = transitions[0];
        return selected;
    }
    ClearHover() {
        for (const polygon of this._hoverPolygons) {
            this._mapper.RemovePolygon(polygon);
        }
        this._hoverPolygons.length = 0;
    }
    HitTestAndConvert(region, lat, lng) {
        let allPolygons = [];
        let inZone = false;
        let selectedPolygon = null;
        for (const polygon of region) {
            var rayTest = 0;
            let lastPoint = polygon.points.slice(-2);
            let coords = [];
            for (let i = 0; i < polygon.points.length; i += 2) {
                let point = polygon.points.slice(i, i + 2);
                coords.push(this._mapper.CreatePoint(point[0], point[1]));
                if ((lastPoint[0] <= lat && point[0] >= lat) ||
                    (lastPoint[0] > lat && point[0] < lat)) {
                    const slope = (point[1] - lastPoint[1]) / (point[0] - lastPoint[0]);
                    const testPoint = slope * (lat - lastPoint[0]) + lastPoint[1];
                    if (testPoint < lng)
                        rayTest++;
                }
                lastPoint = point;
            }
            allPolygons.push({
                polygon: polygon,
                coords: coords
            });
            const odd = (rayTest % 2 == 1);
            inZone = inZone || odd;
            if (odd)
                selectedPolygon = polygon;
        }
        return { allPolygons, inZone, selectedPolygon };
    }
    ClearZones() {
        for (const zone in this._mapZones) {
            const polygons = this._mapZones[zone];
            for (const polygon of polygons) {
                this._mapper.RemovePolygon(polygon);
            }
        }
        this._mapZones = {};
    }
    async DrawZone(zoneName, lat, lng) {
        if (this._mapZones[zoneName])
            return;
        Utils.BeginLoading();
        try {
            if (!this._polygonCache[zoneName]) {
                this._polygonCache[zoneName] = await Network.GetAsync(this._options.jsonRootUrl + `polygons/${zoneName}.json`);
            }
            const data = this._polygonCache[zoneName];
            this._mapZones[zoneName] = [];
            for (const name in data.transitions) {
                const transitions = data.transitions[name];
                if (!this._transitions[name])
                    this._transitions[name] = transitions;
                else
                    this._transitions[name].push(...transitions);
            }
            var result = this.HitTestAndConvert(data.polygons, lat, lng);
            if (result.inZone) {
                this._selectedRegionKey = zoneName;
                for (const polygon of result.allPolygons) {
                    const mapPolygon = this._mapper.AddPolygon(polygon.coords, {
                        color: '#ff0000',
                        opacity: 0.7,
                        width: 1
                    }, {
                        color: '#ffcccc',
                        opacity: 0.5
                    }, () => this.SelectPolygonZone(polygon.polygon), this.ClearHover.bind(this));
                    this._mapZones[zoneName].push(mapPolygon);
                }
                this.SelectPolygonZone(result.selectedPolygon);
            }
        }
        catch {
        }
        finally {
            Utils.EndLoading();
        }
    }
    SelectPolygonZone(polygon) {
        this._selectedPolygon = polygon;
        const transition = this.GetCurrentTransition(this._transitions[polygon.name]);
        const olsonName = polygon.name;
        const utcOffset = transition[1];
        var tzName = transition[2];
        if (this.OnSelect.IsBound) {
            this.OnSelect.Emit(olsonName, utcOffset, tzName);
        }
        else {
            this.ShowInfoWindow('Lorem ipsum');
        }
    }
    SlugifyName(name) {
        return name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    }
}
