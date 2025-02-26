// frontend/src/components/EditTripPage.jsx
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { csrfFetch } from '../../redux/csrf';

function EditTripPage() {
  const { id } = useParams();
  const [body, setBody] = useState('');
  const [status, setStatus] = useState('');
  const [tripLength, setTripLength] = useState('');
  const [stops, setStops] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);
  const [legStats, setLegStats] = useState([]);
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const googleMapRef = useRef(null);
  const markersRef = useRef([]);
  const directionsRendererRef = useRef(null);
  const autocompleteRefs = useRef([]);

  useEffect(() => {
    const fetchTrip = async () => {
      try {
        console.log(`Fetching trip ${id} for editing`);
        const response = await fetch(`/api/posts/${id}`);
        console.log('Fetch response status:', response.status);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Trip not found');
        }
        const data = await response.json();
        console.log('Fetched trip data:', data);
        setBody(data.body);
        setStatus(data.status);
        setTripLength(data.trip_length || '');
        setStops(data.stops ? data.stops.map(stop => ({
          id: stop.id,
          order: stop.order,
          name: stop.name,
          location: stop.location,
          days: stop.days || ''
        })) : [{ order: 1, name: '', location: '', days: '' }]);
      } catch (err) {
        console.error('Fetch error:', err);
        setErrors({ message: err.message });
      } finally {
        setLoading(false);
      }
    };
    fetchTrip();
  }, [id]);

  useEffect(() => {
    if (!googleMapRef.current && window.google && mapRef.current) {
      googleMapRef.current = new window.google.maps.Map(mapRef.current, {
        center: { lat: 37.0902, lng: -95.7129 },
        zoom: 4,
      });
      directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
        map: googleMapRef.current,
        suppressMarkers: true,
      });
    }

    stops.forEach((_, index) => {
      if (!autocompleteRefs.current[index] && document.getElementById(`location-${index}`)) {
        autocompleteRefs.current[index] = new window.google.maps.places.Autocomplete(
          document.getElementById(`location-${index}`),
          { types: ['geocode'] }
        );
        autocompleteRefs.current[index].addListener('place_changed', () => {
          const place = autocompleteRefs.current[index].getPlace();
          if (place && place.formatted_address) {
            handleStopChange(index, 'location', place.formatted_address);
          }
        });
      }
    });

    if (googleMapRef.current && directionsRendererRef.current) {
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];

      const geocoder = new window.google.maps.Geocoder();
      const directionsService = new window.google.maps.DirectionsService();

      const geocodePromises = stops.map(stop => {
        if (stop.location) {
          return new Promise((resolve) => {
            geocoder.geocode({ address: stop.location }, (results, status) => {
              if (status === 'OK' && results[0]) {
                resolve({
                  order: stop.order,
                  name: stop.name,
                  location: results[0].geometry.location,
                  days: stop.days
                });
              } else {
                console.error(`Geocode failed for ${stop.location}: ${status}`);
                resolve(null);
              }
            });
          });
        }
        return Promise.resolve(null);
      });

      Promise.all(geocodePromises).then(geocodedStops => {
        const validStops = geocodedStops.filter(stop => stop !== null);

        validStops.forEach(stop => {
          const marker = new window.google.maps.Marker({
            position: stop.location,
            map: googleMapRef.current,
            title: stop.name || `Stop ${stop.order}`,
            label: `${stop.order}`,
          });
          markersRef.current.push(marker);
        });

        if (validStops.length >= 2) {
          const waypoints = validStops.slice(1, -1).map(stop => ({
            location: stop.location,
            stopover: true
          }));
          directionsService.route(
            {
              origin: validStops[0].location,
              destination: validStops[validStops.length - 1].location,
              waypoints,
              travelMode: window.google.maps.TravelMode.DRIVING,
            },
            (result, status) => {
              if (status === 'OK') {
                directionsRendererRef.current.setDirections(result);
                const route = result.routes[0];
                let totalDistance = 0;
                let totalDuration = 0;
                const legStatsArray = [];
                route.legs.forEach((leg, index) => {
                  const distanceMiles = (leg.distance.value * 0.000621371).toFixed(2);
                  const durationHours = (leg.duration.value / 3600).toFixed(2);
                  totalDistance += leg.distance.value;
                  totalDuration += leg.duration.value;
                  legStatsArray.push({
                    from: validStops[index].name || `Stop ${validStops[index].order}`,
                    to: validStops[index + 1].name || `Stop ${validStops[index + 1].order}`,
                    distance: distanceMiles,
                    duration: durationHours
                  });
                });
                setDistance((totalDistance * 0.000621371).toFixed(2));
                setDuration((totalDuration / 3600).toFixed(2));
                setLegStats(legStatsArray);
              } else {
                console.error(`Directions request failed: ${status}`);
                setDistance(null);
                setDuration(null);
                setLegStats([]);
                const bounds = new window.google.maps.LatLngBounds();
                validStops.forEach(stop => bounds.extend(stop.location));
                googleMapRef.current.fitBounds(bounds);
              }
            }
          );
        } else {
          setDistance(null);
          setDuration(null);
          setLegStats([]);
          if (validStops.length === 1) {
            googleMapRef.current.setCenter(validStops[0].location);
            googleMapRef.current.setZoom(10);
          }
        }
      });
    }
  }, [stops]);

  const handleStopChange = (index, field, value) => {
    const newStops = [...stops];
    newStops[index][field] = field === 'days' ? (value ? parseInt(value) : '') : value;
    setStops(newStops);
  };

  const addStop = () => {
    const newOrder = stops.length + 1;
    setStops([...stops, { order: newOrder, name: '', location: '', days: '' }]);
  };

  const deleteStop = (index) => {
    if (stops.length === 1) {
      setErrors({ stops: 'At least one stop is required' });
      return;
    }
    const newStops = stops.filter((_, i) => i !== index).map((stop, i) => ({
      ...stop,
      order: i + 1
    }));
    setStops(newStops);
    autocompleteRefs.current[index] = null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const invalidStops = stops.some(stop => !stop.name || !stop.location);
    if (invalidStops) {
      setErrors({ stops: 'All stops must have a name and location' });
      return;
    }
    const parsedTripLength = parseInt(tripLength);
    if (!tripLength || parsedTripLength < 1) {
      setErrors({ tripLength: 'Trip length must be at least 1 day' });
      return;
    }
    const totalStopDays = stops.reduce((sum, stop) => sum + (parseInt(stop.days) || 0), 0);
    if (totalStopDays > parsedTripLength) {
      setErrors({ tripLength: 'Trip too long: Total stop days exceed trip length' });
      return;
    }
  
    const tripData = { body, status, tripLength: parsedTripLength, stops };
    console.log('Full tripData being sent:', JSON.stringify(tripData, null, 2));
    try {
      console.log('Submitting updated trip:', tripData);
      const response = await csrfFetch(`/api/posts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tripData)
      });
      console.log('Update response status:', response.status);
      if (!response.ok) {
        const errorData = await response.json();
        console.log('Update error response:', errorData);
        if (response.status === 403) {
          throw new Error('You are not authorized to edit this trip');
        }
        throw new Error(errorData.message || 'Failed to update trip');
      }
      const updatedPost = await response.json();
      console.log('Trip updated:', updatedPost);
      navigate(`/trips/${id}`);
    } catch (err) {
      console.error('Fetch error:', err);
      setErrors({ message: err.message });
    }
  };

  if (loading) return <p>Loading...</p>;
  if (errors.message && !loading) return <p style={{ color: 'red' }}>{errors.message}</p>;

  return (
    <div>
      <h1>Edit Trip</h1>
      {errors.message && <p style={{ color: 'red' }}>{errors.message}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="body">Trip Description:</label>
          <textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="status">Status:</label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="planned">Planned</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <div style={{ marginTop: '10px' }}>
          <label htmlFor="tripLength">Trip Length (days):</label>
          <input
            type="number"
            id="tripLength"
            value={tripLength}
            onChange={(e) => setTripLength(e.target.value)}
            min="1"
            required
            style={{ marginLeft: '10px' }}
          />
          {errors.tripLength && <p style={{ color: 'red' }}>{errors.tripLength}</p>}
        </div>
        <h2>Stops</h2>
        {errors.stops && <p style={{ color: 'red' }}>{errors.stops}</p>}
        {stops.map((stop, index) => (
          <div key={index} style={{ marginBottom: '15px' }}>
            <label>Stop {stop.order}:</label>
            <input
              type="text"
              value={stop.name}
              onChange={(e) => handleStopChange(index, 'name', e.target.value)}
              placeholder="Stop Name (e.g., Starting Point)"
              required
              style={{ marginLeft: '10px' }}
            />
            <input
              type="text"
              id={`location-${index}`}
              value={stop.location}
              onChange={(e) => handleStopChange(index, 'location', e.target.value)}
              placeholder="Location (e.g., NYC)"
              required
              style={{ marginLeft: '10px' }}
            />
            <input
              type="number"
              value={stop.days}
              onChange={(e) => handleStopChange(index, 'days', e.target.value)}
              placeholder="Days (e.g., 1)"
              min="1"
              max={tripLength || Infinity}
              style={{ marginLeft: '10px', width: '60px' }}
            />
            {stops.length > 1 && (
              <button
                type="button"
                onClick={() => deleteStop(index)}
                style={{ marginLeft: '10px', color: 'red' }}
              >
                Delete Stop
              </button>
            )}
            {index > 0 && legStats[index - 1] && (
              <p style={{ marginLeft: '10px' }}>
                From {legStats[index - 1].from} to {legStats[index - 1].to}: 
                {legStats[index - 1].distance} miles, {legStats[index - 1].duration} hours
              </p>
            )}
          </div>
        ))}
        <button type="button" onClick={addStop} style={{ marginBottom: '20px' }}>
          Add Another Stop
        </button>
        <div
          ref={mapRef}
          style={{ width: '100%', height: '400px', marginBottom: '10px' }}
        ></div>
        <div style={{ marginBottom: '20px' }}>
          {distance && duration ? (
            <p>Total Distance: {distance} miles | Estimated Duration: {duration} hours</p>
          ) : (
            <p>Add at least two stops to see route statistics</p>
          )}
        </div>
        <button type="submit">Update Trip</button>
      </form>
    </div>
  );
}

export default EditTripPage;