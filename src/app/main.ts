// TODO: Cleanup

// Events/event api url
const API_URL = 'assets/events.json';
let Events: EventEntry[] = [];
let EventId: number = -1;
type EventEntry = {
    Id: number,
    Name: string,
    At: Date
};
const SidenavEventSelected: EventEmitter = new EventEmitter();
/**
 * Application entrypoint - called when DOM is loaded and application is ready to run
 */
async function Loaded() {
    // Setup timezone picket
    const timezonePicker = new TimezonePicker(document.querySelector('#zonepicker'),
        {
            mapper: TZGoogleMapsProvider,
            jsonRootUrl: 'assets/tz_json/',
            initialLat: 0,
            initialLng: 0,
            initialZoom: 2,
            mapOptions: {
                maxZoom: 11,
                minZoom: 2,
                styles: gmapStyle
            }
        });

    // Select browser local timezone
    timezonePicker.OnReady.Subscribe(() => {
        timezonePicker.SelectZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    });
    SidenavEventSelected.Subscribe((eventId) => {
        EventId = eventId;
        const event = Events.find(e => e.Id == eventId);
        timezonePicker.SetDate(event.At);
        timezonePicker.SelectZone(timezonePicker.GetSelectedZone());
    });

    // Display info window with event data
    timezonePicker.OnSelect.Subscribe((olsonName, utcOffset, tzName) => {
        DisplayActiveEvent(timezonePicker, olsonName, utcOffset, tzName);
    });


    await LoadEvents();
    // Sync picker and event dates
    if (EventId > -1) {
        const event = Events.find(e => e.Id == EventId);
        timezonePicker.SetDate(event.At);
    }

    // Initialize timezone picker after we have events, so we can display it right away
    await timezonePicker.InitializeAsync();
    await BuildMenu();
    Utils.EndLoading();
}

// Begin loading
Utils.BeginLoading();
google.maps.event.addDomListener(window, 'load', Loaded);

/**
 * Loads any events from API and sorts them out based on the date from newest to oldest
 */
async function LoadEvents() {
    const rawEvents = await Network.GetAsync<any[]>(API_URL);

    // Process dates and sort by date time of occurance
    Events = rawEvents.map(evt => <EventEntry>{ Id: evt.id, At: new Date(evt.at), Name: evt.name })
        .sort((a, b) => b.At.getTime() - a.At.getTime());

    const queryId = Utils.GetQueryParameterByName("id");
    // TODO: Check if queryId > 0 etc...
    EventId = queryId != null ? parseInt(queryId) : (Events.length > 0 ? Events[0].Id : -1);
    console.groupCollapsed("Events");
    console.log("DB", Events);
    console.log("Query", EventId);
    console.groupEnd();
}

/**
 * Populates sidebar menu with future and past events
 */
async function BuildMenu() {
    const container = document.querySelector('#eventContainer');
    container.innerHTML = ''; // Clear

    const now = new Date();
    const futureEvents = Events.filter(e => e.At.getTime() >= now.getTime());
    const pastEvents = Events.filter(e => e.At.getTime() < now.getTime());

    // Draw upcomming events
    container.appendChild(DOM.CreateElement('h3', {}, 'Upcomming events'));
    for (const event of futureEvents) {
        container.appendChild(DOM.CreateElement('a', { onclick: SidenavEventSelected.Emit.bind(SidenavEventSelected, event.Id) }, event.Name));
    }
    if (futureEvents.length == 0) {
        container.appendChild(DOM.CreateElement('a', { class: 'disabled' }, 'No upcomming events'));
    }

    // Draw past events
    container.appendChild(DOM.CreateElement('h3', {}, 'Past events'));
    for (const event of pastEvents) {
        container.appendChild(DOM.CreateElement('a', { onclick: SidenavEventSelected.Emit.bind(SidenavEventSelected, event.Id) }, event.Name));
    }
    if (pastEvents.length == 0) {
        container.appendChild(DOM.CreateElement('a', { class: 'disabled' }, 'No past events'));
    }
}

/**
 * Handles tz pickers OnSelected event and renders apropriate informations about the event
 * @param instance Timezone picker instance
 * @param olsonName Timezone OLSON name
 * @param utcOffset Timezone offset from UTC in minutes
 * @param tzName Timezone name
 */
function DisplayActiveEvent(instance: TimezonePicker, olsonName: string, utcOffset: number, tzName: string) {
    if (EventId == -1) {
        instance.ShowInfoWindow("No active event found.");
        return;
    }
    const targetEvent = Events.find(e => e.Id == EventId);
    // Calculate offseted times

    // Local time
    const now = new Date();

    // Adjusted time to target timezone
    const localNow = new Date(now.getTime() + (now.getTimezoneOffset() + utcOffset) * 60 * 1000);

    // Adjust event time to local timezone
    const localEventTime = new Date(targetEvent.At); // Copy the date so we don't mofify original object
    localEventTime.setTime(localEventTime.getTime() + (localEventTime.getTimezoneOffset() + utcOffset) * 60 * 1000);

    // TODO: Try and convert HH:MM:SS to users local format?

    // Simple function to pad single digit number with leading zero
    const pad = (d: number) => d < 10 ? '0' + d : d.toString();

    // HTML Content
    const content = `
    <h2>${targetEvent.Name}</h2>
    <table>
        <tr>
            <td><strong>Event starts at: </strong></td>
            <td><strong>${localEventTime.toLocaleString()}</strong></td>
        </td>

        <tr>
            <td>Current time: </td>
            <td>${pad(localNow.getHours())}:${pad(localNow.getMinutes())}:${pad(localNow.getSeconds())}</td>
        </td>

        <tr>
            <td>Your time: </td>
            <td>${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}</td>
        </td>

        <tr>
            <td>Local Timezone: </td>
            <td>${olsonName} (${tzName})</td>
        </td>

        <tr>
            <td>Offset from UTC (hours): </td>
            <td>${utcOffset / 60}</td>
        </td>
    </table>
    `;
    instance.ShowInfoWindow(content);
}

//////////////////////////////////////////////////
// Google maps dark theme magic
//////////////////////////////////////////////////
const gmapStyle = [
    {
        "featureType": "all",
        "elementType": "all",
        "stylers": [
            {
                "visibility": "on"
            }
        ]
    },
    {
        "featureType": "all",
        "elementType": "labels",
        "stylers": [
            {
                "visibility": "off"
            },
            {
                "saturation": "-100"
            }
        ]
    },
    {
        "featureType": "all",
        "elementType": "labels.text.fill",
        "stylers": [
            {
                "saturation": 36
            },
            {
                "color": "#000000"
            },
            {
                "lightness": 40
            },
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "all",
        "elementType": "labels.text.stroke",
        "stylers": [
            {
                "visibility": "off"
            },
            {
                "color": "#000000"
            },
            {
                "lightness": 16
            }
        ]
    },
    {
        "featureType": "all",
        "elementType": "labels.icon",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "administrative",
        "elementType": "geometry.fill",
        "stylers": [
            {
                "color": "#000000"
            },
            {
                "lightness": 20
            }
        ]
    },
    {
        "featureType": "administrative",
        "elementType": "geometry.stroke",
        "stylers": [
            {
                "color": "#000000"
            },
            {
                "lightness": 17
            },
            {
                "weight": 1.2
            }
        ]
    },
    {
        "featureType": "landscape",
        "elementType": "geometry",
        "stylers": [
            {
                "color": "#000000"
            },
            {
                "lightness": 20
            }
        ]
    },
    {
        "featureType": "landscape",
        "elementType": "geometry.fill",
        "stylers": [
            {
                "color": "#4d6059"
            }
        ]
    },
    {
        "featureType": "landscape",
        "elementType": "geometry.stroke",
        "stylers": [
            {
                "color": "#4d6059"
            }
        ]
    },
    {
        "featureType": "landscape.natural",
        "elementType": "geometry.fill",
        "stylers": [
            {
                "color": "#4d6059"
            }
        ]
    },
    {
        "featureType": "poi",
        "elementType": "geometry",
        "stylers": [
            {
                "lightness": 21
            }
        ]
    },
    {
        "featureType": "poi",
        "elementType": "geometry.fill",
        "stylers": [
            {
                "color": "#4d6059"
            }
        ]
    },
    {
        "featureType": "poi",
        "elementType": "geometry.stroke",
        "stylers": [
            {
                "color": "#4d6059"
            }
        ]
    },
    {
        "featureType": "road",
        "elementType": "geometry",
        "stylers": [
            {
                "visibility": "on"
            },
            {
                "color": "#7f8d89"
            }
        ]
    },
    {
        "featureType": "road",
        "elementType": "geometry.fill",
        "stylers": [
            {
                "color": "#7f8d89"
            }
        ]
    },
    {
        "featureType": "road.highway",
        "elementType": "geometry.fill",
        "stylers": [
            {
                "color": "#7f8d89"
            },
            {
                "lightness": 17
            }
        ]
    },
    {
        "featureType": "road.highway",
        "elementType": "geometry.stroke",
        "stylers": [
            {
                "color": "#7f8d89"
            },
            {
                "lightness": 29
            },
            {
                "weight": 0.2
            }
        ]
    },
    {
        "featureType": "road.arterial",
        "elementType": "geometry",
        "stylers": [
            {
                "color": "#000000"
            },
            {
                "lightness": 18
            }
        ]
    },
    {
        "featureType": "road.arterial",
        "elementType": "geometry.fill",
        "stylers": [
            {
                "color": "#7f8d89"
            }
        ]
    },
    {
        "featureType": "road.arterial",
        "elementType": "geometry.stroke",
        "stylers": [
            {
                "color": "#7f8d89"
            }
        ]
    },
    {
        "featureType": "road.local",
        "elementType": "geometry",
        "stylers": [
            {
                "color": "#000000"
            },
            {
                "lightness": 16
            }
        ]
    },
    {
        "featureType": "road.local",
        "elementType": "geometry.fill",
        "stylers": [
            {
                "color": "#7f8d89"
            }
        ]
    },
    {
        "featureType": "road.local",
        "elementType": "geometry.stroke",
        "stylers": [
            {
                "color": "#7f8d89"
            }
        ]
    },
    {
        "featureType": "transit",
        "elementType": "geometry",
        "stylers": [
            {
                "color": "#000000"
            },
            {
                "lightness": 19
            }
        ]
    },
    {
        "featureType": "water",
        "elementType": "all",
        "stylers": [
            {
                "color": "#2b3638"
            },
            {
                "visibility": "on"
            }
        ]
    },
    {
        "featureType": "water",
        "elementType": "geometry",
        "stylers": [
            {
                "color": "#2b3638"
            },
            {
                "lightness": 17
            }
        ]
    },
    {
        "featureType": "water",
        "elementType": "geometry.fill",
        "stylers": [
            {
                "color": "#24282b"
            }
        ]
    },
    {
        "featureType": "water",
        "elementType": "geometry.stroke",
        "stylers": [
            {
                "color": "#24282b"
            }
        ]
    },
    {
        "featureType": "water",
        "elementType": "labels",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "water",
        "elementType": "labels.text",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "water",
        "elementType": "labels.text.fill",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "water",
        "elementType": "labels.text.stroke",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "water",
        "elementType": "labels.icon",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    }
]
