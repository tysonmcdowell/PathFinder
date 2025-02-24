// frontend/src/components/CreateTripPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { createPostThunk } from '../../redux/posts';

function CreateTripPage() {
  const [body, setBody] = useState('');
  const [status, setStatus] = useState('planned');
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(state => state.session.user);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setErrors({ message: 'You must be logged in to create a trip' });
      return;
    }
    try {
      console.log('Submitting trip:', { body, status });
      const newPost = await dispatch(createPostThunk({ body, status }));
      console.log('Trip created:', newPost);
      navigate(`/trips/${newPost.id}`);
    } catch (err) {
      console.error('Fetch error:', err);
      setErrors({ message: err.message });
    }
  };

  return (
    <div>
      <h1>Create a New Trip</h1>
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
        <button type="submit" disabled={!user}>Create Trip</button>
      </form>
    </div>
  );
}

export default CreateTripPage;