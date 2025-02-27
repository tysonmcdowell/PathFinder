// frontend/src/components/TripDetailsPage/TripDetailsPage.jsx
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { csrfFetch } from '../../redux/csrf';
import './TripDetailsPage.css';

function TripDetailsPage() {
  const { id } = useParams();
  const [trip, setTrip] = useState(null);
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(1);
  const [editReviewId, setEditReviewId] = useState(null);
  const [editReviewText, setEditReviewText] = useState('');
  const [editRating, setEditRating] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);
  const [legStats, setLegStats] = useState([]);
  const [travelMode, setTravelMode] = useState('DRIVING');
  const [showElevation, setShowElevation] = useState(false);
  const [elevations, setElevations] = useState([]);
  const [showCost, setShowCost] = useState(false);
  const [mpg, setMpg] = useState('20');
  const navigate = useNavigate();
  const user = useSelector((state) => state.session.user);
  const mapRef = useRef(null);
  const googleMapRef = useRef(null);
  const markersRef = useRef([]);
  const directionsRendererRef = useRef(null);

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
        console.log(`Fetching trip with ID: ${id}`);
        const response = await fetch(`/api/posts/${id}`);
        console.log('Response status:', response.status);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Trip not found');
        }
        const data = await response.json();
        console.log('Raw fetched trip data:', JSON.stringify(data, null, 2));

        let adaptedTrip = { ...data };
        const stopsArray = Array.isArray(data.stops) ? data.stops : [];
        if (stopsArray.length >= 2 && !data.start && !data.end) {
          adaptedTrip = {
            ...data,
            start: stopsArray[0],
            stops: stopsArray.length > 2 ? stopsArray.slice(1, -1) : [],
            end: stopsArray[stopsArray.length - 1],
          };
        } else if (stopsArray.length === 1) {
          adaptedTrip = {
            ...data,
            start: stopsArray[0],
            stops: [],
            end: { name: 'Unknown End', location: '' },
          };
        } else if (stopsArray.length === 0) {
          adaptedTrip = {
            ...data,
            start: { name: 'Unknown Start', location: '' },
            stops: [],
            end: { name: 'Unknown End', location: '' },
          };
        } else {
          adaptedTrip = {
            ...data,
            start: data.start || { name: 'Unknown Start', location: '' },
            stops: data.stops || [],
            end: data.end || { name: 'Unknown End', location: '' },
          };
        }
        console.log('Adapted trip data:', JSON.stringify(adaptedTrip, null, 2));
        setTrip(adaptedTrip);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err.message);
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
        disableDefaultUI: true,
      });
      directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
        map: googleMapRef.current,
        suppressMarkers: true,
      });
    }

    if (trip && googleMapRef.current && directionsRendererRef.current) {
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];

      const geocoder = new window.google.maps.Geocoder();
      const directionsService = new window.google.maps.DirectionsService();
      const elevationService = new window.google.maps.ElevationService();

      const allStops = [trip.start, ...(trip.stops || []), trip.end];
      const isSameStartEnd = trip.start?.location === trip.end?.location && allStops.length > 1;

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

        // Adjust markers if start and end are the same
        if (isSameStartEnd) {
          // Only show the last stop number for the combined start/end
          const combinedStop = {
            ...validStops[0], // Use start's data
            order: validStops.length, // Last stop number
          };
          const marker = new window.google.maps.Marker({
            position: combinedStop.location,
            map: googleMapRef.current,
            title: combinedStop.name || `Stop ${combinedStop.order}`,
            label: `${combinedStop.order}`,
          });
          markersRef.current.push(marker);

          // Add markers for intermediate stops (if any)
          validStops.slice(1, -1).forEach((stop) => {
            const marker = new window.google.maps.Marker({
              position: stop.location,
              map: googleMapRef.current,
              title: stop.name || `Stop ${stop.order}`,
              label: `${stop.order}`,
            });
            markersRef.current.push(marker);
          });
        } else {
          // Normal case: show all stops
          validStops.forEach((stop) => {
            const marker = new window.google.maps.Marker({
              position: stop.location,
              map: googleMapRef.current,
              title: stop.name || `Stop ${stop.order}`,
              label: `${stop.order}`,
            });
            markersRef.current.push(marker);
          });
        }

        const isOwner = user && trip && user.id === trip.owner_id;
        if (isOwner && showElevation && validStops.length > 0) {
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
                  setError('Elevation data unavailable: API key issue.');
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
  }, [trip, travelMode, showElevation, showCost, mpg]);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this trip?')) return;
    try {
      console.log(`Deleting trip with ID: ${id}`);
      const response = await csrfFetch(`/api/posts/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      console.log('Delete response status:', response.status);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete trip');
      }
      console.log('Trip deleted successfully');
      navigate('/');
    } catch (err) {
      console.error('Delete error:', err);
      setError(err.message);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setError('You must be logged in to leave a review');
      return;
    }
    try {
      console.log('Submitting review:', { rating, reviews: reviewText });
      const response = await csrfFetch(`/api/posts/${id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, reviews: reviewText }),
      });
      console.log('Review response status:', response.status);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit review');
      }
      const newReview = await response.json();
      console.log('Review submitted:', newReview);
      const updatedResponse = await fetch(`/api/posts/${id}`);
      const updatedData = await updatedResponse.json();
      console.log('Updated trip data after review:', JSON.stringify(updatedData, null, 2));
      const stopsArray = Array.isArray(updatedData.stops) ? updatedData.stops : [];
      setTrip({
        ...updatedData,
        start: stopsArray.length > 0 ? stopsArray[0] : trip.start || { name: 'Unknown Start', location: '' },
        stops: stopsArray.length > 2 ? stopsArray.slice(1, -1) : [],
        end: stopsArray.length > 1 ? stopsArray[stopsArray.length - 1] : trip.end || { name: 'Unknown End', location: '' },
      });
      setReviewText('');
      setRating(1);
    } catch (err) {
      console.error('Review error:', err);
      setError(err.message);
    }
  };

  const handleReviewEditStart = (review) => {
    setEditReviewId(review.id);
    setEditReviewText(review.reviews);
    setEditRating(review.rating);
  };

  const handleReviewEditSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setError('You must be logged in to edit a review');
      return;
    }
    try {
      console.log('Submitting edited review:', { rating: editRating, reviews: editReviewText });
      const response = await csrfFetch(`/api/posts/${id}/reviews/${editReviewId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: editRating, reviews: editReviewText }),
      });
      console.log('Edit review response status:', response.status);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to edit review');
      }
      const updatedReview = await response.json();
      console.log('Review edited:', updatedReview);
      const updatedResponse = await fetch(`/api/posts/${id}`);
      const updatedData = await updatedResponse.json();
      console.log('Updated trip data after edit:', JSON.stringify(updatedData, null, 2));
      const stopsArray = Array.isArray(updatedData.stops) ? updatedData.stops : [];
      setTrip({
        ...updatedData,
        start: stopsArray.length > 0 ? stopsArray[0] : trip.start || { name: 'Unknown Start', location: '' },
        stops: stopsArray.length > 2 ? stopsArray.slice(1, -1) : [],
        end: stopsArray.length > 1 ? stopsArray[stopsArray.length - 1] : trip.end || { name: 'Unknown End', location: '' },
      });
      setEditReviewId(null);
      setEditReviewText('');
      setEditRating(1);
    } catch (err) {
      console.error('Edit review error:', err);
      setError(err.message);
    }
  };

  const handleReviewDelete = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    try {
      console.log(`Deleting review ${reviewId} for post ${id}`);
      const response = await csrfFetch(`/api/posts/${id}/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      console.log('Delete review response status:', response.status);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete review');
      }
      console.log('Review deleted successfully');
      const updatedResponse = await fetch(`/api/posts/${id}`);
      const updatedData = await updatedResponse.json();
      console.log('Updated trip data after delete:', JSON.stringify(updatedData, null, 2));
      const stopsArray = Array.isArray(updatedData.stops) ? updatedData.stops : [];
      setTrip({
        ...updatedData,
        start: stopsArray.length > 0 ? stopsArray[0] : trip.start || { name: 'Unknown Start', location: '' },
        stops: stopsArray.length > 2 ? stopsArray.slice(1, -1) : [],
        end: stopsArray.length > 1 ? stopsArray[stopsArray.length - 1] : trip.end || { name: 'Unknown End', location: '' },
      });
    } catch (err) {
      console.error('Delete review error:', err);
      setError(err.message);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="error">{error}</p>;

  const isOwner = user && trip && user.id === trip.owner_id;
  const userHasReviewed = user && trip && trip.reviews?.some((r) => r.user_id === user.id);

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

  const dayRanges = trip && trip.stops ? calculateDayRanges(trip.stops) : [];

  const calculateGasCostPerLeg = (legIndex) => {
    if (!legStats[legIndex] || !mpg) return 0;
    const allStops = [trip.start, ...(trip.stops || []), trip.end];
    const firstStopState = allStops[legIndex]?.location.split(',').pop().trim().split(' ')[0] || 'national';
    const gasPrice = gasPrices[firstStopState] || gasPrices['national'];
    const gallons = legStats[legIndex].distance / mpg;
    return (gallons * gasPrice).toFixed(2);
  };

  const calculateTotalGasCost = () => {
    if (!distance || !trip.trip_length || !mpg) return { totalCost: 0, perDayCost: 0 };
    const totalCost = legStats.reduce((sum, _, index) => sum + parseFloat(calculateGasCostPerLeg(index) || 0), 0).toFixed(2);
    const perDayCost = (totalCost / trip.trip_length).toFixed(2);
    return { totalCost, perDayCost };
  };

  const { totalCost, perDayCost } = showCost ? calculateTotalGasCost() : { totalCost: 0, perDayCost: 0 };

  if (!trip) return <p className="error">Trip data not available</p>;

  return (
    <div className="trip-details-container">
      <h1>{trip.body}</h1>
      <p>Status: {trip.status}</p>
      <p>Total Trip Length: {trip.trip_length ? `${trip.trip_length} days` : 'Not specified'}</p>
      <p>Created by: {trip.owner?.username || 'Unknown'}</p>
      <div style={{ marginBottom: '10px' }}>
        <label htmlFor="travelMode">Travel Mode: </label>
        <select id="travelMode" value={travelMode} onChange={(e) => setTravelMode(e.target.value)}>
          <option value="DRIVING">Driving</option>
          <option value="WALKING">Walking</option>
          <option value="FLYING">Flying</option>
        </select>
      </div>
      {isOwner && (
        <div style={{ marginBottom: '10px' }}>
          <label>
            <input type="checkbox" checked={showElevation} onChange={(e) => setShowElevation(e.target.checked)} />
            Show Elevation
          </label>
        </div>
      )}
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
      <ul>
        <li>
          {trip.start ? `${trip.start.name} - ${trip.start.location}` : 'Starting point not available'}
          <div className="stop-details">
            {isOwner && showElevation && elevations[0] !== undefined && (
              <div style={{ color: '#7f8c8d' }}>Elevation: {elevations[0]} ft</div>
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
        </li>
      </ul>
      <h2>Stops</h2>
      <ul>
        {trip.stops && trip.stops.length > 0 ? (
          trip.stops.map((stop, index) => (
            <li key={stop.id || index}>
              {stop.name} - {stop.location}
              <div className="stop-details">
                <span>Time at Location: {stop.days ? `${stop.days} days` : 'Not specified'}</span>
                {dayRanges[index] && (
                  <span style={{ marginLeft: '10px', color: '#8e44ad' }}>
                    {dayRanges[index].stayDays <= 1
                      ? `(Day ${dayRanges[index].startDay})`
                      : `(Day ${dayRanges[index].startDay} - Day ${dayRanges[index].endDay})`}
                  </span>
                )}
                {isOwner && showElevation && elevations[index + 1] !== undefined && (
                  <div style={{ color: '#7f8c8d' }}>Elevation: {elevations[index + 1]} ft</div>
                )}
                {showCost && index + 1 < trip.stops.length + 1 && legStats[index + 1] && (
                  <div style={{ color: '#27ae60' }}>Gas Cost to Next Stop: ${calculateGasCostPerLeg(index + 1)}</div>
                )}
                {index + 1 < trip.stops.length + 1 && legStats[index + 1] && (
                  <div style={{ fontStyle: 'italic', color: '#555' }}>
                    From {legStats[index + 1].from} to {legStats[index + 1].to}: {legStats[index + 1].distance} miles,{' '}
                    {legStats[index + 1].duration} hours
                  </div>
                )}
              </div>
            </li>
          ))
        ) : (
          <p>No intermediate stops</p>
        )}
      </ul>
      <h2>Ending Point</h2>
      <ul>
        <li>
          {trip.end ? `${trip.end.name} - ${trip.end.location}` : 'Ending point not available'}
          <div className="stop-details">
            {isOwner && showElevation && elevations[elevations.length - 1] !== undefined && (
              <div style={{ color: '#7f8c8d' }}>Elevation: {elevations[elevations.length - 1]} ft</div>
            )}
          </div>
        </li>
      </ul>
      <h2>Map</h2>
      <div className="map-container" ref={mapRef}></div>
      <div className="stats">
        {distance && duration ? (
          <p>
            Total Distance: {distance} miles | Estimated Duration: {duration} hours
            {showCost && ` | Total Gas Cost: $${totalCost} | Per Day Cost: $${perDayCost}`}
          </p>
        ) : (
          <p>Route statistics require at least two stops</p>
        )}
      </div>
      <h2>Reviews</h2>
      <ul>
        {trip.reviews && trip.reviews.length > 0 ? (
          trip.reviews.map((review) => (
            <li key={review.id}>
              {editReviewId === review.id ? (
                <form onSubmit={handleReviewEditSubmit} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <select value={editRating} onChange={(e) => setEditRating(parseInt(e.target.value))}>
                    {[1, 2, 3, 4, 5].map((num) => (
                      <option key={num} value={num}>
                        {num}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={editReviewText}
                    onChange={(e) => setEditReviewText(e.target.value)}
                    required
                  />
                  <button type="submit">Save</button>
                  <button type="button" onClick={() => setEditReviewId(null)}>
                    Cancel
                  </button>
                </form>
              ) : (
                <>
                  {review.rating} stars - {review.reviews} (by {review.reviewer?.username || 'Unknown'})
                  {user && review.user_id === user.id && (
                    <div style={{ marginTop: '5px' }}>
                      <button
                        onClick={() => handleReviewEditStart(review)}
                        style={{ backgroundColor: '#3498db', marginRight: '5px' }}
                      >
                        Edit Review
                      </button>
                      <button onClick={() => handleReviewDelete(review.id)} className="delete">
                        Delete Review
                      </button>
                    </div>
                  )}
                </>
              )}
            </li>
          ))
        ) : (
          <p>No reviews yet</p>
        )}
      </ul>
      {user && !userHasReviewed && (
        <form onSubmit={handleReviewSubmit} className="review-form">
          <h3>Leave a Review</h3>
          <div style={{ marginBottom: '10px' }}>
            <label htmlFor="rating">Rating (1-5):</label>
            <select id="rating" value={rating} onChange={(e) => setRating(parseInt(e.target.value))}>
              {[1, 2, 3, 4, 5].map((num) => (
                <option key={num} value={num}>
                  {num}
                </option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label htmlFor="reviewText">Review:</label>
            <textarea
              id="reviewText"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              required
            />
          </div>
          <button type="submit">Submit Review</button>
        </form>
      )}
      {isOwner && (
        <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button onClick={() => navigate(`/trips/${id}/edit`)}>Edit Trip</button>
          <button onClick={handleDelete} className="delete">
            Delete Trip
          </button>
        </div>
      )}
    </div>
  );
}

export default TripDetailsPage;