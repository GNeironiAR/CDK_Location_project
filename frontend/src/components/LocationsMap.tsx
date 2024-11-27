import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { Pencil, Trash2, Plus } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Configurar el icono por defecto de Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// URL de la API
const API_URL = import.meta.env.VITE_APP_API_URL?.replace(/\/$/, '') || 'http://localhost:3000';
const LOCATIONS_URL = `${API_URL}/locations`;

// Tipos
type Location = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  description?: string;
  address?: string;
};

type LocationFormData = Omit<Location, 'id'>;

const defaultCenter = { lat: -31.4201, lng: -64.1888 }; // Centered in Córdoba, Argentina

const LocationPicker = ({ onLocationSelect }: { onLocationSelect: (latlng: { lat: number; lng: number }) => void }) => {
  const [tempMarker, setTempMarker] = useState<{ lat: number; lng: number } | null>(null);
  
  useMapEvents({
    click: (e) => {
      const latlng = { lat: e.latlng.lat, lng: e.latlng.lng };
      setTempMarker(latlng);
      onLocationSelect(latlng);
    },
  });

  return tempMarker ? (
    <Marker position={[tempMarker.lat, tempMarker.lng]}>
      <Popup>Nueva ubicación seleccionada</Popup>
    </Marker>
  ) : null;
};

export default function LocationsMap() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [locationSelected, setLocationSelected] = useState(false);
  const [formData, setFormData] = useState<LocationFormData>({
    name: '',
    latitude: 0,
    longitude: 0,
    description: '',
    address: ''
  });

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const response = await fetch(LOCATIONS_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setLocations(data);
      setError(null);
    } catch (error) {
      console.error('Error fetching locations:', error);
      setError('Error loading locations. Please try again later.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationSelected) {
      setError('Please select a location on the map before saving.');
      return;
    }
    try {
      const response = await fetch(LOCATIONS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error creating location');
      }

      await fetchLocations();
      resetForm();
      setError(null);
    } catch (error) {
      console.error('Error creating location:', error);
      setError(error instanceof Error ? error.message : 'Error creating location');
    }
  };

  const handleUpdate = async (id: string) => {
    if (!id) return;
    if (!locationSelected && formData.latitude === 0 && formData.longitude === 0) {
      setError('Please select a location on the map before updating.');
      return;
    }
    
    try {
      const response = await fetch(`${LOCATIONS_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error updating location');
      }

      await fetchLocations();
      resetForm();
      setError(null);
    } catch (error) {
      console.error('Error updating location:', error);
      setError(error instanceof Error ? error.message : 'Error updating location');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`${LOCATIONS_URL}/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error deleting location');
      }

      await fetchLocations();
      setError(null);
    } catch (error) {
      console.error('Error deleting location:', error);
      setError(error instanceof Error ? error.message : 'Error deleting location');
    }
  };

  const resetForm = () => {
    setIsAdding(false);
    setIsEditing(false);
    setSelectedLocation(null);
    setLocationSelected(false);
    setFormData({
      name: '',
      latitude: 0,
      longitude: 0,
      description: '',
      address: ''
    });
  };

  return (
    <div className="h-screen flex bg-white">
      <div className="w-1/3 p-4 overflow-y-auto bg-white border-r">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">NGO Locations</h1>
          <button
            onClick={() => {
              resetForm();
              setIsAdding(true);
            }}
            className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600"
            disabled={isEditing}
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
            {error}
          </div>
        )}

        {(isAdding || isEditing) && (
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (isEditing && selectedLocation) {
                handleUpdate(selectedLocation.id);
              } else {
                handleSubmit(e);
              }
            }} 
            className="mb-4 space-y-4"
          >
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Address</label>
              <input
                type="text"
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="text-sm text-gray-600 mb-2">
              Click on the map to set the location
            </div>
            {locationSelected && (
              <div className="text-sm text-green-600 mb-2">
                ✓ Location selected
              </div>
            )}
            <div className="flex space-x-2">
              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                {isEditing ? 'Update' : 'Save'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="space-y-2">
          {locations.map((location) => (
            <div
              key={location.id}
              className="p-4 border rounded hover:bg-gray-50 flex justify-between items-center"
            >
              <div>
                <h3 className="font-medium">{location.name}</h3>
                {location.address && (
                  <p className="text-sm text-gray-600">{location.address}</p>
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setIsAdding(false);
                    setSelectedLocation(location);
                    setFormData({
                      name: location.name,
                      latitude: location.latitude,
                      longitude: location.longitude,
                      description: location.description,
                      address: location.address
                    });
                  }}
                  className="text-blue-500 hover:text-blue-600"
                >
                  <Pencil className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDelete(location.id)}
                  className="text-red-500 hover:text-red-600"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={`w-2/3 bg-gray-100 ${(isAdding || isEditing) ? 'cursor-crosshair' : ''}`}>
        <MapContainer
          center={defaultCenter}
          zoom={12}
          className="h-full w-full"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {locations.map((location) => (
            <Marker
              key={location.id}
              position={[location.latitude, location.longitude]}
            >
              <Popup>
                <h3 className="font-medium">{location.name}</h3>
                {location.description && <p>{location.description}</p>}
                {location.address && <p className="text-sm">{location.address}</p>}
              </Popup>
            </Marker>
          ))}
          {(isAdding || isEditing) && (
            <LocationPicker
              onLocationSelect={(latlng) => {
                setFormData({
                  ...formData,
                  latitude: latlng.lat,
                  longitude: latlng.lng,
                });
                setLocationSelected(true);
              }}
            />
          )}
        </MapContainer>
      </div>
    </div>
  );
}