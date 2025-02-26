// frontend/src/components/Splash.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';

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

  // Split posts if logged in
  const myPosts = user ? posts.filter(post => post.owner_id === user.id) : [];
  const othersPosts = user ? posts.filter(post => post.owner_id !== user.id) : posts;

  return (
    <div>
      <h1>Welcome To PathFinder</h1>
      {user && (
        <Link to="/create-trip">Create a New Trip</Link>
      )}

      {user && (
        <>
          <h2>My Posts</h2>
          {myPosts.length > 0 ? (
            <ul>
              {myPosts.map(post => (
                <li key={post.id}>
                  <Link to={`/trips/${post.id}`}>
                    {post.body} - {post.status} (by {post.owner?.username || 'Unknown'})
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p>You haven’t created any trips yet.</p>
          )}
        </>
      )}

      <h2>{user ? "Others' Posts" : "All Trips"}</h2>
      {othersPosts.length > 0 ? (
        <ul>
          {othersPosts.map(post => (
            <li key={post.id}>
              <Link to={`/trips/${post.id}`}>
                {post.body} - {post.status} (by {post.owner?.username || 'Unknown'})
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