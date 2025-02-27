import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { csrfFetch } from '../../redux/csrf';
import './EditTripPage.css';

function EditTripPage() {
  const { id } = useParams();
  const [body, setBody] = useState('');
  const [status, setStatus] = useState('');
  const [tripLength, setTripLength] = useState('');
  const [start, setStart] = useState({ name: '', location: '' });
  const [stops, setStops] = useState([]);
  const [end, setEnd] = useState({ name: '', location: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);
  const [legStats, setLegStats] = useState([]);
  const [travelMode, setTravelMode] = useState('DRIVING');
  const [showElevation, setShowElevation] = useState(false);
  const [elevations, setElevations] = useState([]);
  const [showCost, setShowCost] = useState(false);
  const [mpg, setMpg] = useState('20');
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const googleMapRef = useRef(null);
  const markersRef = useRef([]);
  const directionsRendererRef = useRef(null);
  const autocompleteRefs = useRef({ start: null, end: null, stops: [] });

  const gasPrices = {
    CA: 4.39,
    HI: 4.54,
    WA: 3.90,
    MS: 2.65,
    OK: 2.67,
    TX: 2.69,
    OH: 3.15,
    UT: 3.03,
    CO: 2.90,
    AK: 3.39,
    OR: 3.61,
    NV: 3.66,
    national: 3.14,
  };

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
        console.log('Fetched trip data:', JSON.stringify(data, null, 2));

        const stopsArray = Array.isArray(data.stops) ? data.stops : [];
        if (stopsArray.length === 0) {
          setStart({ name: '', location: '' });
          setStops([]);
          setEnd({ name: '', location: '' });
        } else if (data.stops && !data.start && !data.end) {
          setStart(stopsArray[0] || { name: '', location: '' });
          setStops(stopsArray.length > 2 ? stopsArray.slice(1, -1).map((stop, i) => ({ ...stop, order: i + 1 })) : []);
          setEnd(stopsArray.length > 1 ? stopsArray[stopsArray.length - 1] : { name: '', location: '' });
        } else {
          setStart(data.start || { name: '', location: '' });
          setStops(data.stops ? data.stops.map((stop, i) => ({ ...stop, order: i + 1 })) : []);
          setEnd(data.end || { name: '', location: '' });
        }
        setBody(data.body || '');
        setStatus(data.status || 'planned');
        setTripLength(data.trip_length || '');
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

    const startInput = document.getElementById('start-location');
    if (startInput && !autocompleteRefs.current.start) {
      autocompleteRefs.current.start = new window.google.maps.places.Autocomplete(startInput, { types: ['geocode'] });
      autocompleteRefs.current.start.addListener('place_changed', () => {
        const place = autocompleteRefs.current.start.getPlace();
        if (place && place.formatted_address) {
          setStart((prev) => ({ ...prev, location: place.formatted_address }));
        }
      });
    }

    stops.forEach((_, index) => {
      const inputElement = document.getElementById(`stop-location-${index}`);
      if (inputElement && !autocompleteRefs.current.stops[index]) {
        autocompleteRefs.current.stops[index] = new window.google.maps.places.Autocomplete(inputElement, {
          types: ['geocode'],
        });
        autocompleteRefs.current.stops[index].addListener('place_changed', () => {
          const place = autocompleteRefs.current.stops[index].getPlace();
          if (place && place.formatted_address) {
            handleStopChange(index, 'location', place.formatted_address);
          }
        });
      }
    });

    const endInput = document.getElementById('end-location');
    if (endInput && !autocompleteRefs.current.end) {
      autocompleteRefs.current.end = new window.google.maps.places.Autocomplete(endInput, { types: ['geocode'] });
      autocompleteRefs.current.end.addListener('place_changed', () => {
        const place = autocompleteRefs.current.end.getPlace();
        if (place && place.formatted_address) {
          setEnd((prev) => ({ ...prev, location: place.formatted_address }));
        }
      });
    }

    if (googleMapRef.current && directionsRendererRef.current) {
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];

      const geocoder = new window.google.maps.Geocoder();
      const directionsService = new window.google.maps.DirectionsService();
      const elevationService = new window.google.maps.ElevationService();

      const allStops = [start, ...stops, end];
      const geocodePromises = allStops.map((stop, i) => {
        if (stop && stop.location) {
          return new Promise((resolve) => {
            geocoder.geocode({ address: stop.location }, (results, status) => {
              if (status === 'OK' && results[0]) {
                resolve({
                  order: i + 1,
                  name: stop.name,
                  location: results[0].geometry.location,
                  days: stop.days,
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

      Promise.all(geocodePromises).then((geocodedStops) => {
        const validStops = geocodedStops.filter((stop) => stop !== null);

        validStops.forEach((stop) => {
          const marker = new window.google.maps.Marker({
            position: stop.location,
            map: googleMapRef.current,
            title: stop.name || `Stop ${stop.order}`,
            label: `${stop.order}`,
          });
          markersRef.current.push(marker);
        });

        if (showElevation && validStops.length > 0) {
          elevationService.getElevationForLocations(
            { locations: validStops.map((stop) => stop.location) },
            (results, status) => {
              if (status === 'OK' && results) {
                const elevationData = results.map((result) => (result.elevation * 3.28084).toFixed(0));
                setElevations(elevationData);
              } else {
                console.error(`Elevation request failed: ${status}`);
                setElevations(validStops.map(() => 'N/A'));
                if (status === 'REQUEST_DENIED') {
                  setErrors({ message: 'Elevation data unavailable: API key issue.' });
                }
              }
            }
          );
        } else {
          setElevations([]);
        }

        if (validStops.length >= 2) {
          const waypoints = validStops.slice(1, -1).map((stop) => ({
            location: stop.location,
            stopover: true,
          }));

          if (travelMode === 'FLYING') {
            directionsRendererRef.current.setDirections(null);
            let totalDistance = 0;
            const legStatsArray = [];
            for (let i = 0; i < validStops.length - 1; i++) {
              const distanceMeters = window.google.maps.geometry.spherical.computeDistanceBetween(
                validStops[i].location,
                validStops[i + 1].location
              );
              const distanceMiles = (distanceMeters * 0.000621371).toFixed(2);
              const durationHours = (distanceMeters * 0.000621371 / 500).toFixed(2);
              totalDistance += parseFloat(distanceMiles);
              legStatsArray.push({
                from: validStops[i].name || `Stop ${validStops[i].order}`,
                to: validStops[i + 1].name || `Stop ${validStops[i + 1].order}`,
                distance: distanceMiles,
                duration: durationHours,
              });
            }
            setDistance(totalDistance.toFixed(2));
            setDuration((totalDistance / 500).toFixed(2));
            setLegStats(legStatsArray);
            const bounds = new window.google.maps.LatLngBounds();
            validStops.forEach((stop) => bounds.extend(stop.location));
            googleMapRef.current.fitBounds(bounds);
          } else {
            directionsService.route(
              {
                origin: validStops[0].location,
                destination: validStops[validStops.length - 1].location,
                waypoints,
                travelMode: window.google.maps.TravelMode[travelMode],
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
                      duration: durationHours,
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
                  validStops.forEach((stop) => bounds.extend(stop.location));
                  googleMapRef.current.fitBounds(bounds);
                }
              }
            );
          }
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
  }, [start, stops, end, travelMode, showElevation, showCost, mpg]);

  const handleStartChange = (field, value) => {
    setStart((prev) => ({ ...prev, [field]: value }));
  };

  const handleStopChange = (index, field, value) => {
    const newStops = [...stops];
    newStops[index][field] = field === 'days' ? (value ? parseInt(value) : '') : value;
    setStops(newStops);
  };

  const handleEndChange = (field, value) => {
    setEnd((prev) => ({ ...prev, [field]: value }));
  };

  const addStop = () => {
    const newOrder = stops.length + 1;
    setStops([...stops, { order: newOrder, name: '', location: '', days: '' }]);
  };

  const deleteStop = (index) => {
    if (stops.length === 0) return;
    const newStops = stops.filter((_, i) => i !== index).map((stop, i) => ({
      ...stop,
      order: i + 1,
    }));
    setStops(newStops);
    autocompleteRefs.current.stops[index] = null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!start || !start.name || !start.location) {
      setErrors({ message: 'Start point must have a name and location' });
      return;
    }
    if (!end || !end.name || !end.location) {
      setErrors({ message: 'End point must have a name and location' });
      return;
    }
    const invalidStops = stops.some((stop) => !stop || !stop.name || !stop.location);
    if (invalidStops) {
      setErrors({ stops: 'All stops must have a name and location' });
      return;
    }
    if (stops.length === 0) {
      setErrors({ stops: 'Trip must have at least one intermediate stop' });
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

    const tripData = {
      body,
      status,
      tripLength: parsedTripLength,
      stops: [start, ...stops, end],
    };
    console.log('Full tripData being sent:', JSON.stringify(tripData, null, 2));
    try {
      console.log('Submitting updated trip:', tripData);
      const response = await csrfFetch(`/api/posts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tripData),
      });
      console.log('Update response status:', response.status);
      if (!response.ok) {
        const errorData = await response.json();
        console.log('Update error response:', errorData);
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

  const calculateGasCostPerLeg = (legIndex) => {
    if (!legStats[legIndex] || !mpg) return 0;
    const allStops = [start, ...stops, end];
    const firstStopState = allStops[legIndex]?.location.split(',').pop().trim().split(' ')[0] || 'national';
    const gasPrice = gasPrices[firstStopState] || gasPrices['national'];
    const gallons = legStats[legIndex].distance / mpg;
    return (gallons * gasPrice).toFixed(2);
  };

  const calculateTotalGasCost = () => {
    if (!distance || !tripLength || !mpg) return { totalCost: 0, perDayCost: 0 };
    const totalCost = legStats.reduce((sum, _, index) => sum + parseFloat(calculateGasCostPerLeg(index) || 0), 0).toFixed(2);
    const perDayCost = (totalCost / tripLength).toFixed(2);
    return { totalCost, perDayCost };
  };

  const calculateDayRanges = (stops) => {
    let currentDay = 1;
    return stops.map((stop) => {
      const stayDays = stop.days || 0;
      const startDay = currentDay;
      const endDay = stayDays > 0 ? currentDay + stayDays - 1 : currentDay;
      currentDay = endDay + 1;
      return { startDay, endDay, stayDays };
    });
  };

  const { totalCost, perDayCost } = showCost ? calculateTotalGasCost() : { totalCost: 0, perDayCost: 0 };
  const dayRanges = stops.length > 0 ? calculateDayRanges(stops) : [];

  if (loading) return <p>Loading...</p>;
  if (errors.message && !loading) return <p className="error">{errors.message}</p>;

  return (
    <div className="edit-trip-container">
      <h1>Edit Trip</h1>
      {errors.message && <p className="error">{errors.message}</p>}
      {errors.stops && <p className="error">{errors.stops}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="body">Trip Description:</label>
          <textarea id="body" value={body} onChange={(e) => setBody(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="status">Status:</label>
          <select id="status" value={status} onChange={(e) => setStatus(e.target.value)}>
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
            style={{ marginLeft: '10px', width: '60px' }}
          />
          {errors.tripLength && <p className="error">{errors.tripLength}</p>}
        </div>
        <div style={{ marginTop: '10px', marginBottom: '10px' }}>
          <label htmlFor="travelMode">Travel Mode: </label>
          <select id="travelMode" value={travelMode} onChange={(e) => setTravelMode(e.target.value)}>
            <option value="DRIVING">Driving</option>
            <option value="WALKING">Walking</option>
            <option value="FLYING">Flying</option>
          </select>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>
            <input type="checkbox" checked={showElevation} onChange={(e) => setShowElevation(e.target.checked)} />
            Show Elevation
          </label>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>
            <input type="checkbox" checked={showCost} onChange={(e) => setShowCost(e.target.checked)} />
            Show Cost
          </label>
          {showCost && (
            <div style={{ marginTop: '5px', display: 'flex', alignItems: 'center' }}>
              <label htmlFor="mpg">Car MPG: </label>
              <input
                type="number"
                id="mpg"
                value={mpg}
                onChange={(e) => setMpg(e.target.value)}
                min="1"
                style={{ width: '60px', marginLeft: '10px' }}
              />
            </div>
          )}
        </div>
        <h2>Starting Point</h2>
        <div className="stop-section">
          <input
            type="text"
            value={start ? start.name : ''}
            onChange={(e) => handleStartChange('name', e.target.value)}
            placeholder="Starting Point Name"
            required
          />
          <input
            type="text"
            id="start-location"
            value={start ? start.location : ''}
            onChange={(e) => handleStartChange('location', e.target.value)}
            placeholder="Starting Location (e.g., NYC)"
            required
          />
          <div className="stop-details">
            {showElevation && elevations[0] !== undefined && (
              <span style={{ color: '#7f8c8d' }}>Elevation: {elevations[0]} ft</span>
            )}
            {showCost && legStats[0] && (
              <div style={{ color: '#27ae60' }}>Gas Cost to Next Stop: ${calculateGasCostPerLeg(0)}</div>
            )}
            {legStats[0] && (
              <div style={{ fontStyle: 'italic', color: '#555' }}>
                From {legStats[0].from} to {legStats[0].to}: {legStats[0].distance} miles, {legStats[0].duration} hours
              </div>
            )}
          </div>
        </div>
        <h2>Stops</h2>
        {stops.map((stop, index) => (
          <div key={index} className="stop-section">
            <label>Stop {stop.order}:</label>
            <input
              type="text"
              value={stop.name}
              onChange={(e) => handleStopChange(index, 'name', e.target.value)}
              placeholder="Stop Name"
              required
            />
            <input
              type="text"
              id={`stop-location-${index}`}
              value={stop.location}
              onChange={(e) => handleStopChange(index, 'location', e.target.value)}
              placeholder="Location (e.g., NYC)"
              required
            />
            <input
              type="number"
              value={stop.days}
              onChange={(e) => handleStopChange(index, 'days', e.target.value)}
              placeholder="Days (e.g., 1)"
              min="1"
              max={tripLength || Infinity}
              style={{ width: '60px' }}
            />
            <button type="button" onClick={() => deleteStop(index)} className="delete">
              Delete Stop
            </button>
            <div className="stop-details">
              {dayRanges[index] && (
                <span style={{ color: '#8e44ad' }}>
                  {dayRanges[index].stayDays <= 1
                    ? `(Day ${dayRanges[index].startDay})`
                    : `(Day ${dayRanges[index].startDay} - Day ${dayRanges[index].endDay})`}
                </span>
              )}
              {showElevation && elevations[index + 1] !== undefined && (
                <div style={{ color: '#7f8c8d' }}>Elevation: {elevations[index + 1]} ft</div>
              )}
              {showCost && index + 1 < stops.length + 1 && legStats[index + 1] && (
                <div style={{ color: '#27ae60' }}>Gas Cost to Next Stop: ${calculateGasCostPerLeg(index + 1)}</div>
              )}
              {index + 1 < stops.length + 1 && legStats[index + 1] && (
                <div style={{ fontStyle: 'italic', color: '#555' }}>
                  From {legStats[index + 1].from} to {legStats[index + 1].to}: {legStats[index + 1].distance} miles,{' '}
                  {legStats[index + 1].duration} hours
                </div>
              )}
            </div>
          </div>
        ))}
        <button type="button" onClick={addStop} className="add-stop">
          Add Stop
        </button>
        <h2>Ending Point</h2>
        <div className="stop-section">
          <input
            type="text"
            value={end ? end.name : ''}
            onChange={(e) => handleEndChange('name', e.target.value)}
            placeholder="Ending Point Name"
            required
          />
          <input
            type="text"
            id="end-location"
            value={end ? end.location : ''}
            onChange={(e) => handleEndChange('location', e.target.value)}
            placeholder="Ending Location (e.g., NYC)"
            required
          />
          <div className="stop-details">
            {showElevation && elevations[elevations.length - 1] !== undefined && (
              <div style={{ color: '#7f8c8d' }}>Elevation: {elevations[elevations.length - 1]} ft</div>
            )}
          </div>
        </div>
        <div className="map-container" ref={mapRef}></div>
        <div className="stats">
          {distance && duration ? (
            <p>
              Total Distance: {distance} miles | Estimated Duration: {duration} hours
              {showCost && ` | Total Gas Cost: $${totalCost} | Per Day Cost: $${perDayCost}`}
            </p>
          ) : (
            <p>Add start and end points to see route statistics</p>
          )}
        </div>
        <button type="submit">Update Trip</button>
      </form>
    </div>
  );
}

export default EditTripPage;