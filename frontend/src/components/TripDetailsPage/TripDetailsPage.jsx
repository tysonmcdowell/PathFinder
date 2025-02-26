// frontend/src/components/TripDetailsPage.jsx
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { csrfFetch } from '../../redux/csrf';

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
  const [legStats, setLegStats] = useState([]); // Add leg stats for consistency
  const navigate = useNavigate();
  const user = useSelector(state => state.session.user);
  const mapRef = useRef(null);
  const googleMapRef = useRef(null);
  const markersRef = useRef([]);
  const directionsRendererRef = useRef(null);

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
        console.log('Fetched trip:', data);
        setTrip(data);
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
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];

      const geocoder = new window.google.maps.Geocoder();
      const directionsService = new window.google.maps.DirectionsService();

      const geocodePromises = trip.stops.map(stop => {
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
  }, [trip]);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this trip?')) return;
    try {
      console.log(`Deleting trip with ID: ${id}`);
      const response = await csrfFetch(`/api/posts/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
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
        body: JSON.stringify({ rating, reviews: reviewText })
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
      setTrip(updatedData);
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
        body: JSON.stringify({ rating: editRating, reviews: editReviewText })
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
      setTrip(updatedData);
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
        headers: { 'Content-Type': 'application/json' }
      });
      console.log('Delete review response status:', response.status);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete review');
      }
      console.log('Review deleted successfully');
      const updatedResponse = await fetch(`/api/posts/${id}`);
      const updatedData = await updatedResponse.json();
      setTrip(updatedData);
    } catch (err) {
      console.error('Delete review error:', err);
      setError(err.message);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  const isOwner = user && trip && user.id === trip.owner_id;
  const userHasReviewed = user && trip && trip.reviews?.some(r => r.user_id === user.id);

  return (
    <div>
      <h1>{trip.body}</h1>
      <p>Status: {trip.status}</p>
      <p>Total Trip Length: {trip.trip_length ? `${trip.trip_length} days` : 'Not specified'}</p>
      <p>Created by: {trip.owner_username || 'Unknown'}</p>
      <h2>Stops</h2>
      <ul>
        {trip.stops?.length > 0 ? (
          trip.stops.map((stop, index) => (
            <li key={stop.id}>
              {stop.name} - {stop.location} 
              {stop.days ? ` (Day ${stop.days})` : ' (No days assigned)'}
              {index > 0 && legStats[index - 1] && (
                <span style={{ marginLeft: '10px' }}>
                  - From {legStats[index - 1].from} to {legStats[index - 1].to}: 
                  {legStats[index - 1].distance} miles, {legStats[index - 1].duration} hours
                </span>
              )}
            </li>
          ))
        ) : (
          <p>No stops yet</p>
        )}
      </ul>
      <h2>Map</h2>
      <div
        ref={mapRef}
        style={{ width: '100%', height: '400px', marginBottom: '10px' }}
      ></div>
      <div style={{ marginBottom: '20px' }}>
        {distance && duration ? (
          <p>Total Distance: {distance} miles | Estimated Duration: {duration} hours</p>
        ) : (
          <p>Route statistics require at least two stops</p>
        )}
      </div>
      <h2>Reviews</h2>
      <ul>
        {trip.reviews?.length > 0 ? (
          trip.reviews.map(review => (
            <li key={review.id}>
              {editReviewId === review.id ? (
                <form onSubmit={handleReviewEditSubmit} style={{ display: 'inline' }}>
                  <select
                    value={editRating}
                    onChange={(e) => setEditRating(parseInt(e.target.value))}
                    style={{ marginRight: '10px' }}
                  >
                    {[1, 2, 3, 4, 5].map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={editReviewText}
                    onChange={(e) => setEditReviewText(e.target.value)}
                    required
                    style={{ width: '200px', marginRight: '10px' }}
                  />
                  <button type="submit">Save</button>
                  <button type="button" onClick={() => setEditReviewId(null)} style={{ marginLeft: '10px' }}>
                    Cancel
                  </button>
                </form>
              ) : (
                <>
                  {review.rating} stars - {review.reviews} (by {review.reviewer?.username || 'Unknown'})
                  {user && review.user_id === user.id && (
                    <>
                      <button
                        onClick={() => handleReviewEditStart(review)}
                        style={{ marginLeft: '10px', color: 'blue' }}
                      >
                        Edit Review
                      </button>
                      <button
                        onClick={() => handleReviewDelete(review.id)}
                        style={{ marginLeft: '10px', color: 'red' }}
                      >
                        Delete Review
                      </button>
                    </>
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
        <form onSubmit={handleReviewSubmit} style={{ marginTop: '20px' }}>
          <h3>Leave a Review</h3>
          <div>
            <label htmlFor="rating">Rating (1-5):</label>
            <select
              id="rating"
              value={rating}
              onChange={(e) => setRating(parseInt(e.target.value))}
              style={{ marginLeft: '10px' }}
            >
              {[1, 2, 3, 4, 5].map(num => (
                <option key={num} value={num}>{num}</option>
              ))}
            </select>
          </div>
          <div style={{ marginTop: '10px' }}>
            <label htmlFor="reviewText">Review:</label>
            <textarea
              id="reviewText"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              required
              style={{ marginLeft: '10px', width: '300px', height: '100px' }}
            />
          </div>
          <button type="submit" style={{ marginTop: '10px' }}>Submit Review</button>
        </form>
      )}
      {isOwner && (
        <div style={{ marginTop: '20px' }}>
          <button onClick={() => navigate(`/trips/${id}/edit`)}>Edit Trip</button>
          <button onClick={handleDelete} style={{ marginLeft: '10px' }}>Delete Trip</button>
        </div>
      )}
    </div>
  );
}

export default TripDetailsPage;