// frontend/src/components/TripDetailsPage.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { csrfFetch } from '../../redux/csrf'; // Adjust path if needed

function TripDetailsPage() {
  const { id } = useParams();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const user = useSelector(state => state.session.user);

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
      navigate('/'); // Redirect to main page after deletion
    } catch (err) {
      console.error('Delete error:', err);
      setError(err.message);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  const isOwner = user && trip && user.id === trip.owner_id;

  return (
    <div>
      <h1>{trip.body}</h1>
      <p>Status: {trip.status}</p>
      <p>Created by: {trip.owner_username || 'Unknown'}</p>
      <h2>Stops</h2>
      <ul>
        {trip.stops?.length > 0 ? (
          trip.stops.map(stop => (
            <li key={stop.id}>{stop.name} - {stop.location}</li>
          ))
        ) : (
          <p>No stops yet</p>
        )}
      </ul>
      <h2>Reviews</h2>
      <ul>
        {trip.reviews?.length > 0 ? (
          trip.reviews.map(review => (
            <li key={review.id}>
              {review.rating} stars - {review.reviews} (by {review.reviewer?.username || 'Unknown'})
            </li>
          ))
        ) : (
          <p>No reviews yet</p>
        )}
      </ul>
      {isOwner && (
        <div>
          <button onClick={() => navigate(`/trips/${id}/edit`)}>Edit Trip</button>
          <button onClick={handleDelete} style={{ marginLeft: '10px' }}>Delete Trip</button>
        </div>
      )}
    </div>
  );
}

export default TripDetailsPage;