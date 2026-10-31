# Map Search Workflow

## User Flow

1. Choose Grid, Split List & Map, or Map from the housing results toolbar.
2. Search or filter by area, campus, budget, property type, amenities, or distance. The map receives the same filtered property set as the list.
3. Pan and zoom the map using drag, wheel/pinch, or the map controls. Reset View fits visible listings or recenters on the selected campus.
4. Select a school to center the map and show its campus marker plus a true 1,000-meter radius circle.
5. Select a monthly-price marker to center it and open a listing popup. Choose View listing to open the property detail page.
6. In Split mode, hover a list card to highlight its matching map pin; moving off the card clears the highlight.

## Implementation

The map uses Leaflet and React-Leaflet with real latitude/longitude positions and OpenStreetMap tiles. RentPH provides the property/campus markers and the popups. Search data is currently sourced from the frontend demo store; map geometry and tiles are real, but marketplace data is not yet loaded from the Go API.

OpenStreetMap attribution is displayed by Leaflet. The public `tile.openstreetmap.org` endpoint is suitable for development and light testing; production traffic should use a tile provider whose terms and capacity fit the deployment. No Google Maps API key is configured, so this is a Google-Maps-style interactive map, not Google Maps.