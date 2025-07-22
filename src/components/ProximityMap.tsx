import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin } from 'lucide-react';

interface PendingAppointment {
  id: string;
  customer_address: string;
  vehicle_year: string;
  vehicle_make: string;
  vehicle_model: string;
  created_at: string;
  estimated_price: number;
  coordinates?: {
    lat: number;
    lng: number;
  };
  distance?: number;
}

interface ProximityMapProps {
  zipcodeCoordinates: { lat: number; lng: number } | null;
  nearbyAppointments: PendingAppointment[];
}

export function ProximityMap({ zipcodeCoordinates, nearbyAppointments }: ProximityMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState("");
  const [mapInitialized, setMapInitialized] = useState(false);

  const initializeMap = () => {
    if (!mapContainer.current || !mapboxToken.trim()) return;

    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: zipcodeCoordinates ? [zipcodeCoordinates.lng, zipcodeCoordinates.lat] : [-118.2437, 34.0522], // Default to LA
      zoom: 10,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    setMapInitialized(true);
  };

  useEffect(() => {
    if (!map.current || !mapInitialized) return;

    // Clear existing markers
    const existingMarkers = document.querySelectorAll('.mapboxgl-marker');
    existingMarkers.forEach(marker => marker.remove());

    // Add zipcode marker (blue)
    if (zipcodeCoordinates) {
      const zipcodeMarker = new mapboxgl.Marker({ color: '#3b82f6' })
        .setLngLat([zipcodeCoordinates.lng, zipcodeCoordinates.lat])
        .setPopup(new mapboxgl.Popup().setHTML('<div><strong>Searched Zipcode</strong></div>'))
        .addTo(map.current);
    }

    // Add appointment markers (red)
    nearbyAppointments.forEach((appointment, index) => {
      if (appointment.coordinates) {
        const marker = new mapboxgl.Marker({ color: '#ef4444' })
          .setLngLat([appointment.coordinates.lng, appointment.coordinates.lat])
          .setPopup(
            new mapboxgl.Popup().setHTML(`
              <div class="p-2">
                <strong>${appointment.vehicle_year} ${appointment.vehicle_make} ${appointment.vehicle_model}</strong><br>
                <small>${appointment.customer_address}</small><br>
                <strong>$${appointment.estimated_price?.toLocaleString()}</strong><br>
                <small>${appointment.distance} miles away</small>
              </div>
            `)
          )
          .addTo(map.current);
      }
    });

    // Fit map to show all markers if we have coordinates
    if (zipcodeCoordinates && nearbyAppointments.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      bounds.extend([zipcodeCoordinates.lng, zipcodeCoordinates.lat]);
      
      nearbyAppointments.forEach(appointment => {
        if (appointment.coordinates) {
          bounds.extend([appointment.coordinates.lng, appointment.coordinates.lat]);
        }
      });

      map.current.fitBounds(bounds, { padding: 50 });
    }

  }, [zipcodeCoordinates, nearbyAppointments, mapInitialized]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      map.current?.remove();
    };
  }, []);

  if (!zipcodeCoordinates) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Location Map
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!mapInitialized && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Enter your Mapbox public token to view the map:
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="Mapbox public token (pk.xxx...)"
                value={mapboxToken}
                onChange={(e) => setMapboxToken(e.target.value)}
                className="flex-1"
              />
              <Button onClick={initializeMap} disabled={!mapboxToken.trim()}>
                Show Map
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Get your token at <a href="https://mapbox.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">mapbox.com</a>
            </p>
          </div>
        )}
        
        <div 
          ref={mapContainer} 
          className={`rounded-lg shadow-lg ${mapInitialized ? 'h-96' : 'h-0'}`}
        />
        
        {mapInitialized && (
          <div className="text-sm text-muted-foreground space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Your searched zipcode</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Pending appointments</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}