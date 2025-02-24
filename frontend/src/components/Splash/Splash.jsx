// frontend/src/components/Splash.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux'; // Added for user state

const Splash = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const user = useSelector(state => state.session.user); // Get current user

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        console.log('Fetching posts from /api/posts');
        const response = await fetch('/api/posts', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        });
        console.log('Response status:', response.status);

        if (!response.ok) {
          const errorData = await response.json();
          console.log('Error response:', errorData);
          throw new Error(errorData.message || `Failed to fetch posts: ${response.status}`);
        }

        const data = await response.json();
        console.log('Fetched posts:', data);
        setPosts(data.Posts || []);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;

  return (
    <div>
      <h1>Welcome To PathFinder</h1>
      {user && ( // Only show "Create a New Trip" if logged in
        <Link to="/create-trip">Create a New Trip</Link>
      )}
      {posts.length > 0 ? (
        <ul>
          {posts.map(post => (
            <li key={post.id}>
              <Link to={`/trips/${post.id}`}>
                {post.body} - {post.status} (by {post.owner?.username || 'Unknown'}) - 
                {post.numReviews} Reviews, Avg Rating: {post.avgRating}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p>No trips available yet.</p>
      )}
    </div>
  );
};

export default Splash;