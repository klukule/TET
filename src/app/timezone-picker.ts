// Copyright © Lukáš 'klukule' Jech - 2020

/**
 * Entry in TZ_JSON bounding box data
 */
type TZBoundingBoxEntry = {
    boundingBox: TZBoundingBox;
    zoneCentroids: TZZoneCentroids;
    name: string;
}

type TZBoundingBox = {
    xmin: number;
    ymin: number;
    xmax: number;
    ymax: number;
}

type TZZoneCentroids = { [key: string]: number[] };

type TZHoverRegionEntry = {
    hoverRegion: TZHoverRegion;
    name: string;
    transitions: any[];
};

type TZHoverRegion = { points: number[] }[];

/**
 * Defines common stroke structure
 */
type TimezonePickerStroke = {
    color: string;
    opacity: number;
    width: number;
};

/**
 * Defines common fill structure
 */
type TimezonePickerFill = {
    color: string;
    opacity: number;
};

/**
 * Wrapper around any for clearer code
 */
type TimezonePickerCoordinate = any;

/**
 * Wrapper around any for clearer code
 */
type TimezonePickerPolygon = any;

type TimezonePickerCallbackEventArgs = { latLng: { lat: () => number, lng: () => number } };

/**
 * General interface to allow any map API be used in common fashion
 */
abstract class TimezonePickerMapper {

    /**
     * Constructor
     * @param el target map element
     * @param mouseClickHandler click handler on blank space
     * @param mouseMoveHandler mouse move handler on blank space
     * @param mapOptions implementation specific map options
     */
    constructor(el: HTMLElement, mouseClickHandler: (...args: any[]) => void, mouseMoveHandler: (...args: any[]) => void, mapOptions: {}) {

    }

    /**
     * Creates implementation specific polygon implementation and returns it
     * @param coords list of coordinates defining the polygon
     * @param stroke stroke settings
     * @param fill fill settings
     * @param clickHandler polygon click handler
     * @param moveHandler polygon mousemove handler
     */
    abstract AddPolygon(coords: TimezonePickerCoordinate[], stroke: TimezonePickerStroke, fill: TimezonePickerFill, clickHandler: (...args: any[]) => void, moveHandler: (...args: any[]) => void): TimezonePickerPolygon;

    /**
     * Removes specified polygon from the map  
     * @param polygon The polygon to remove
     */
    abstract RemovePolygon(polygon: TimezonePickerPolygon): void;

    /**
     * Creates implementation specific coordinates implementation using specified latitude and longitude and returns it
     * @param lat Latitude
     * @param lng Longitude
     */
    abstract CreatePoint(lat: number, lng: number): TimezonePickerCoordinate;

    /**
     * 
     * @param position Map coordinates of the window
     * @param content Window content HTML string
     * @param callback Callback - called when window is added to dom, this context is infowindow html element
     */
    abstract ShowInfoWindow(position: TimezonePickerCoordinate, content: string, callback: () => void): void;

    /**
     * Hides any open info window - if any
     */
    abstract HideInfoWindow(): void;
}

/**
 * Timezone Picker options interface
 */
interface ITimezonePickerOptions {
    initialZoom?: number;
    initialLat?: number;
    initialLng?: number;
    strokeColor?: string;
    strokeOpacity?: number;
    strokeWeight?: number;
    fillColor?: string;
    fillOpacity?: number;
    jsonRootUrl?: string;
    date?: Date;
    mapOptions?: {};
    mapper: any; // TODO: Solve how to hard type
    hoverRegions?: boolean; // undefined == true, false, true
}

class TimezonePicker {
    private _mapper: TimezonePickerMapper = null;
    private _options: ITimezonePickerOptions = null;
    private _boundingBoxes: TZBoundingBoxEntry[] = [];
    private _zoneCentroids: TZZoneCentroids = {};
    private _selectedRegionKey: string = null;
    private _selectedPolygon;
    private _mapZones: { [key: string]: TimezonePickerPolygon } = {};
    private _transitions = {};
    private _selectedZone = null;
    private _isLoaded = false;

    /**
     * Contains cached data from polygon responses - lazyloaded as required
     */
    private _polygonCache: { [key: string]: any } = {};

    private _currentHoverRegion: string = null;
    private _hoverRegions: { [key: string]: TZHoverRegionEntry } = {};
    private _hoverPolygons: TimezonePickerPolygon[] = [];

    public OnReady: EventEmitter = new EventEmitter();
    public OnHover: EventEmitter = new EventEmitter();
    public OnSelect: EventEmitter = new EventEmitter();


    constructor(targetElement: Element, options: ITimezonePickerOptions) {
        this._options = options || { mapper: null };

        // Assign defaults
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

        if (!this._options.mapOptions) this._options.mapOptions = {};
        this._options.mapOptions['zoom'] = this._options.initialZoom;
        this._options.mapOptions['centerLat'] = this._options.initialLat;
        this._options.mapOptions['centerLng'] = this._options.initialLng;

        if (typeof this._options.hoverRegions === 'undefined')
            this._options.hoverRegions = true;

        if (!this._options.mapper)
            throw new Error("Mapper is not specified");

        // Spawn specified mapper implementation
        this._mapper = new this._options.mapper(
            targetElement,
            this.MapClickHandler.bind(this),
            this._options.hoverRegions ? this.MapMouseMoveHandler.bind(this) : null,
            this._options.mapOptions
        );
    }

    public async InitializeAsync() {
        Utils.BeginLoading();
        try {
            // Load bounding boxes
            this._boundingBoxes = await Network.GetAsync<TZBoundingBoxEntry[]>(this._options.jsonRootUrl + 'bounding_boxes.json');

            // Merge zone centroids
            for (const box of this._boundingBoxes) {
                for (const zone in box.zoneCentroids) {
                    this._zoneCentroids[zone] = box.zoneCentroids[zone];
                }
            }

            // Load hover regions if requested
            if (this._options.hoverRegions) {
                let hoverRegions = await Network.GetAsync<TZHoverRegionEntry[]>(this._options.jsonRootUrl + 'hover_regions.json');
                for (const region of hoverRegions) {
                    this._hoverRegions[region.name] = region;
                }
            }

            console.groupCollapsed("Loaded TZ JSON Data");
            console.log("Bounding boxes", this._boundingBoxes);
            console.log("Zone centroids", this._zoneCentroids);
            console.log("Hover regions", this._hoverRegions);
            console.groupEnd();

            // On Ready
            this._isLoaded = true;
            this.OnReady.Emit();
        } catch (err) {
            console.error(err);
        } finally {
            Utils.EndLoading();
        }
    }

    public SetDate(date: Date) {
        this.HideInfoWindow();
        this._options.date = date;
    }

    public ShowInfoWindow(content: string) {
        // Hack to get the centroid of the largest polygon - we just check
        // which has the most edges
        let centroid = null;
        var maxPoints = 0;
        if (this._selectedPolygon.points.length > maxPoints) {
            centroid = this._selectedPolygon.centroid;
            maxPoints = this._selectedPolygon.points.length;
        }

        this.HideInfoWindow();

        // TODO: Make async and hook the callback to promise success
        this._mapper.ShowInfoWindow(this._mapper.CreatePoint(centroid[1], centroid[0]), content, () => { });
    }

    public HideInfoWindow() {
        this._mapper.HideInfoWindow();
    }

    public SelectZone(olsonName: string) {
        this._selectedZone = olsonName;
        const centroid = this._zoneCentroids[olsonName];
        // Click the centroid
        if (centroid) {
            this.MapClickHandler({ latLng: { lat: () => centroid[1], lng: () => centroid[0] } });
        }
    }

    public GetSelectedZone() {
        return this._selectedZone;
    }

    private async MapClickHandler(e: TimezonePickerCallbackEventArgs) {
        if (!this._isLoaded) return;
        this.HideInfoWindow();

        const lat = e.latLng.lat();
        const lng = e.latLng.lng();

        const candidates: string[] = [];

        // Search for candidate bounding boxes for specified coordinates
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


    private MapMouseMoveHandler(e: TimezonePickerCallbackEventArgs) {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();

        for (const box of this._boundingBoxes) {
            const bb = box.boundingBox;
            if (lat > bb.ymin && lat < bb.ymax && lng > bb.xmin && lng < bb.xmax) {
                const hoverRegion = this._hoverRegions[box.name];
                if (!hoverRegion) continue;

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

    private GetCurrentTransition(transitions: any[]) {
        if (transitions.length == 1) return transitions[0];
        const now = this._options.date.getTime() / 1000;
        let selected = 0;
        for (let i = 0; i < transitions.length; i++) {
            const transition = transitions[i];
            if (transition[0] < now && i < transitions.length - 1 && transitions[i + 1][0] > now) {
                selected = transition;
            }
        }

        if (!selected) selected = transitions[0];
        return selected;
    }

    private ClearHover() {
        for (const polygon of this._hoverPolygons) {
            this._mapper.RemovePolygon(polygon);
        }
        this._hoverPolygons.length = 0;
    }

    private HitTestAndConvert(region: TZHoverRegion, lat: number, lng: number) {
        let allPolygons = [];
        let inZone = false;
        let selectedPolygon = null;
        for (const polygon of region) {
            var rayTest = 0;
            let lastPoint = polygon.points.slice(-2);

            // Go through each coordinate pair (vec2) and do point x polygon collision check
            let coords: TimezonePickerCoordinate[] = [];
            for (let i = 0; i < polygon.points.length; i += 2) {
                let point = polygon.points.slice(i, i + 2);
                coords.push(this._mapper.CreatePoint(point[0], point[1]));

                // point x polygon collision check
                if (
                    (lastPoint[0] <= lat && point[0] >= lat) ||
                    (lastPoint[0] > lat && point[0] < lat)
                ) {
                    const slope = (point[1] - lastPoint[1]) / (point[0] - lastPoint[0]);
                    const testPoint = slope * (lat - lastPoint[0]) + lastPoint[1];
                    if (testPoint < lng) rayTest++;
                }

                lastPoint = point;
            }

            allPolygons.push({
                polygon: polygon,
                coords: coords
            });

            // If the count is odd, we are in the polygon
            const odd = (rayTest % 2 == 1);
            inZone = inZone || odd;
            if (odd)
                selectedPolygon = polygon;
        }

        return { allPolygons, inZone, selectedPolygon };
    }

    private ClearZones() {
        for (const zone in this._mapZones) {
            const polygons = this._mapZones[zone];
            for (const polygon of polygons) {
                this._mapper.RemovePolygon(polygon);
            }
        }
        this._mapZones = {};
    }

    private async DrawZone(zoneName: string, lat: number, lng: number) {
        if (this._mapZones[zoneName]) return;
        Utils.BeginLoading();
        try {
            // Load and cache polygon data when required
            if (!this._polygonCache[zoneName]) {
                this._polygonCache[zoneName] = await Network.GetAsync<any>(this._options.jsonRootUrl + `polygons/${zoneName}.json`);
            }
            const data = this._polygonCache[zoneName];


            this._mapZones[zoneName] = [];

            for (const name in data.transitions) {
                this._transitions[name] = data.transitions[name];
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
        } catch {

        } finally {
            Utils.EndLoading();
        }

    }

    private SelectPolygonZone(polygon: any) {
        this._selectedPolygon = polygon;

        const transition = this.GetCurrentTransition(this._transitions[polygon.name]);

        const olsonName = polygon.name;
        const utcOffset = transition[1];
        var tzName = transition[2];

        if (this.OnSelect.IsBound) {
            this.OnSelect.Emit(olsonName, utcOffset, tzName);
        } else {
            // TODO: Show default dialog
            this.ShowInfoWindow('Lorem ipsum');
        }
    }

    private SlugifyName(name: string): string {
        return name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    }
}