import React, { useEffect, useState } from 'react';
import { Property, School } from '../../types';
import { ImageWithFallback } from '../common/ImageWithFallback';
import {
  GraduationCap, ArrowRight, ZoomIn, ZoomOut, Compass
} from 'lucide-react';
import {
  Circle,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import { divIcon, latLngBounds, type LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface InteractiveMapSearchProps {
  properties: Property[];
  selectedSchool?: School;
  selectedProperty: Property | null;
  onSelectProperty: (property: Property) => void;
  hoveredPropertyId: string | null;
  setHoveredPropertyId: (id: string | null) => void;
}

interface MapViewportProps {
  properties: Property[];
  selectedSchool?: School;
  locationKey: string;
  mapCenter: LatLngExpression;
}

const MapViewport: React.FC<MapViewportProps> = ({ properties, selectedSchool, locationKey, mapCenter }) => {
  const map = useMap();

  useEffect(() => {
    if (selectedSchool) {
      map.flyTo([selectedSchool.latitude, selectedSchool.longitude], 14, { duration: 0.5 });
    } else if (properties.length > 1) {
      const bounds = latLngBounds(properties.map(property => [property.latitude, property.longitude] as [number, number]));
      map.fitBounds(bounds.pad(0.2), { maxZoom: 13, animate: true });
    } else {
      map.flyTo(mapCenter, properties.length === 1 ? 14 : 12, { duration: 0.5 });
    }
  }, [map, locationKey]);

  return null;
};

interface MapControlsProps {
  properties: Property[];
  selectedSchool?: School;
  mapCenter: LatLngExpression;
  initialZoom: number;
}

const MapControls: React.FC<MapControlsProps> = ({ properties, selectedSchool, mapCenter, initialZoom }) => {
  const map = useMap();

  const resetView = () => {
    if (selectedSchool) {
      map.flyTo([selectedSchool.latitude, selectedSchool.longitude], 14, { duration: 0.5 });
    } else if (properties.length > 1) {
      const bounds = latLngBounds(properties.map(property => [property.latitude, property.longitude] as [number, number]));
      map.flyToBounds(bounds.pad(0.2), { maxZoom: 13, duration: 0.5 });
    } else {
      map.flyTo(mapCenter, initialZoom, { duration: 0.5 });
    }
  };

  return (
    <div className="absolute right-4 top-4 z-[1000] flex flex-col gap-1.5">
      <button type="button" onClick={() => map.zoomIn()} aria-label="Zoom in" className="p-2 bg-white hover:bg-slate-50 text-slate-700 rounded-lg shadow-md border border-slate-200 cursor-pointer">
        <ZoomIn className="w-4 h-4" />
      </button>
      <button type="button" onClick={() => map.zoomOut()} aria-label="Zoom out" className="p-2 bg-white hover:bg-slate-50 text-slate-700 rounded-lg shadow-md border border-slate-200 cursor-pointer">
        <ZoomOut className="w-4 h-4" />
      </button>
      <button type="button" onClick={resetView} aria-label="Reset map view" className="p-2 bg-white hover:bg-slate-50 text-slate-700 rounded-lg shadow-md border border-slate-200 cursor-pointer">
        <Compass className="w-4 h-4" />
      </button>
    </div>
  );
};

const ClearPinOnMapClick: React.FC<{ onClear: () => void }> = ({ onClear }) => {
  useMapEvents({ click: onClear });
  return null;
};

interface PropertyPriceMarkerProps {
  property: Property;
  isSelected: boolean;
  isHovered: boolean;
  onSelectProperty: (property: Property) => void;
  setActivePinProperty: (property: Property) => void;
  setHoveredPropertyId: (id: string | null) => void;
}

const PropertyPriceMarker: React.FC<PropertyPriceMarkerProps> = ({
  property,
  isSelected,
  isHovered,
  onSelectProperty,
  setActivePinProperty,
  setHoveredPropertyId,
}) => {
  const map = useMap();
  const pinState = isSelected ? 'is-active' : isHovered ? 'is-hovered' : '';
  const availability = property.availableBedsCount > 0 ? '<i class="rentph-price-pin__dot"></i>' : '';
  const icon = divIcon({
    className: 'rentph-price-icon',
    html: `<div class="rentph-price-pin ${pinState}">₱${(property.monthlyRent / 1000).toFixed(1)}k${availability}</div>`,
    iconSize: [76, 38],
    iconAnchor: [38, 19],
  });

  return (
    <Marker
      position={[property.latitude, property.longitude]}
      icon={icon}
      eventHandlers={{
        click: () => {
          setActivePinProperty(property);
          setHoveredPropertyId(property.id);
          map.flyTo([property.latitude, property.longitude], Math.max(map.getZoom(), 15), { duration: 0.4 });
        },
        mouseover: () => setHoveredPropertyId(property.id),
        mouseout: () => setHoveredPropertyId(null),
      }}
    >
      <Popup>
        <div className="flex w-60 gap-3 py-1 text-left">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100">
            <ImageWithFallback src={property.images[0]?.imageUrl} alt={property.title} className="h-full w-full object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-semibold text-slate-900">{property.title}</div>
            <div className="mt-1 text-xs font-medium text-slate-700">₱{property.monthlyRent.toLocaleString()} / month</div>
            <div className="mt-0.5 text-[11px] text-slate-500">{property.availableBedsCount} beds available</div>
            <button type="button" onClick={() => onSelectProperty(property)} className="mt-2 flex items-center gap-1 text-xs font-semibold text-slate-900 hover:text-blue-700">
              View listing <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </Popup>
    </Marker>
  );
};

export const InteractiveMapSearch: React.FC<InteractiveMapSearchProps> = ({
  properties,
  selectedSchool,
  selectedProperty,
  onSelectProperty,
  hoveredPropertyId,
  setHoveredPropertyId,
}) => {
  const [activePinProperty, setActivePinProperty] = useState<Property | null>(null);
  const defaultCenter: LatLngExpression = [14.5995, 120.9842];
  const mapCenter: LatLngExpression = selectedSchool
    ? [selectedSchool.latitude, selectedSchool.longitude]
    : properties.length > 0
      ? [
          properties.reduce((total, property) => total + property.latitude, 0) / properties.length,
          properties.reduce((total, property) => total + property.longitude, 0) / properties.length,
        ]
      : defaultCenter;
  const initialZoom = selectedSchool ? 14 : 12;
  const locationKey = selectedSchool
    ? `school:${selectedSchool.id}`
    : properties.map(property => `${property.id}:${property.latitude}:${property.longitude}`).join('|');

  const schoolIcon = divIcon({
    className: 'rentph-school-icon',
    html: '<div class="rentph-school-pin"><span>U</span></div>',
    iconSize: [38, 42],
    iconAnchor: [19, 38],
  });

  const createPriceIcon = (property: Property, isActive: boolean, isHovered: boolean) => {
    const pinState = isActive ? 'is-active' : isHovered ? 'is-hovered' : '';
    const availability = property.availableBedsCount > 0 ? '<i class="rentph-price-pin__dot"></i>' : '';

    return divIcon({
      className: 'rentph-price-icon',
      html: `<div class="rentph-price-pin ${pinState}">₱${(property.monthlyRent / 1000).toFixed(1)}k${availability}</div>`,
      iconSize: [76, 38],
      iconAnchor: [38, 19],
    });
  };

  return (
    <div className="relative isolate w-full h-[620px] rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-inner">
      <MapContainer
        center={mapCenter}
        zoom={initialZoom}
        minZoom={10}
        maxZoom={19}
        scrollWheelZoom
        zoomControl={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        <MapViewport properties={properties} selectedSchool={selectedSchool} locationKey={locationKey} mapCenter={mapCenter} />
        <MapControls properties={properties} selectedSchool={selectedSchool} mapCenter={mapCenter} initialZoom={initialZoom} />
        <ClearPinOnMapClick onClear={() => setActivePinProperty(null)} />

        {selectedSchool && (
          <>
            <Circle
              center={[selectedSchool.latitude, selectedSchool.longitude]}
              radius={1000}
              pathOptions={{ color: '#d97706', weight: 2, dashArray: '6 6', fillColor: '#f59e0b', fillOpacity: 0.1 }}
            />
            <Marker position={[selectedSchool.latitude, selectedSchool.longitude]} icon={schoolIcon}>
              <Popup>
                <div className="min-w-36 text-sm">
                  <div className="font-semibold">{selectedSchool.name}</div>
                  <div className="text-xs text-slate-500">University campus · 1 km walk zone</div>
                </div>
              </Popup>
            </Marker>
          </>
        )}

        {properties.map(property => {
          return (
            <PropertyPriceMarker
              key={property.id}
              property={property}
              isHovered={hoveredPropertyId === property.id}
              isSelected={selectedProperty?.id === property.id || activePinProperty?.id === property.id}
              onSelectProperty={onSelectProperty}
              setActivePinProperty={setActivePinProperty}
              setHoveredPropertyId={setHoveredPropertyId}
            />
          );
        })}
      </MapContainer>

      <div className="pointer-events-none absolute left-4 top-4 z-[1000] flex items-center gap-3 rounded-lg border border-slate-200 bg-white/95 px-3 py-2 text-[10px] text-slate-700 shadow-md">
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span>Available Beds</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          <span>University Campus</span>
        </div>
      </div>
    </div>
  );
};
