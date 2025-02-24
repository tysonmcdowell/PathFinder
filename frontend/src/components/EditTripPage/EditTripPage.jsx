// frontend/src/components/EditTripPage.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { csrfFetch } from '../../redux/csrf';

function EditTripPage() {
  const { id } = useParams();
  const [body, setBody] = useState('');
  const [status, setStatus] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
      } catch (err) {
        console.error('Fetch error:', err);
        setErrors({ message: err.message });
      } finally {
        setLoading(false);
      }
    };
    fetchTrip();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log('Submitting updated trip:', { body, status });
      const response = await csrfFetch(`/api/posts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body, status })
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
        <button type="submit">Update Trip</button>
      </form>
    </div>
  );
}

export default EditTripPage;