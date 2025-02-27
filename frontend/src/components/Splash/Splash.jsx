// frontend/src/components/Splash.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import './Splash.css';

const Splash = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tripImages, setTripImages] = useState({});
  const user = useSelector(state => state.session.user);

  const GOOGLE_MAPS_API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY_HERE';

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
        const fetchedPosts = data.Posts || [];
        setPosts(fetchedPosts);

        const images = {};
        await Promise.all(fetchedPosts.map(async (post) => {
          const stops = post.stops || [];
          if (stops.length > 0) {
            const imageUrl = await fetchPlacePhoto(stops);
            images[post.id] = imageUrl || 'https://via.placeholder.com/250x250?text=No+Image'; 
          } else {
            images[post.id] = 'https://via.placeholder.com/250x250?text=No+Stops';
          }
        }));
        setTripImages(images);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const fetchPlacePhoto = async (stops) => {
    if (!window.google || !window.google.maps) {
      console.error('Google Maps API not loaded');
      return null;
    }

    const placesService = new window.google.maps.places.PlacesService(document.createElement('div'));

    const shuffledStops = [...stops].sort(() => 0.5 - Math.random());

    for (const stop of shuffledStops) {
      if (!stop.location) continue;

      try {
        const request = {
          query: stop.location,
          fields: ['photos'],
        };

        const result = await new Promise((resolve, reject) => {
          placesService.textSearch(request, (results, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && results[0]?.photos?.length > 0) {
              resolve(results[0]);
            } else {
              resolve(null);
            }
          });
        });

        if (result && result.photos && result.photos.length > 0) {
          const photoUrl = result.photos[0].getUrl({ maxWidth: 250, maxHeight: 250 });
          console.log(`Fetched photo for ${stop.location}: ${photoUrl}`);
          return photoUrl;
        }
      } catch (err) {
        console.error(`Error fetching photo for ${stop.location}:`, err);
      }
    }
    return null;
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  const myPosts = user ? posts.filter(post => post.owner_id === user.id) : [];
  const othersPosts = user ? posts.filter(post => post.owner_id !== user.id) : posts;

  return (
    <div className="splash-container">
      <h1>Welcome To PathFinder</h1>
      {user && (
        <Link to="/create-trip" className="cta-button">Create a New Trip</Link>
      )}

      {user && (
        <>
          <h2>My Posts</h2>
          {myPosts.length > 0 ? (
            <div className="trip-grid">
              {myPosts.map(post => (
                <Link
                  key={post.id}
                  to={`/trips/${post.id}`}
                  className="trip-card"
                  style={{ backgroundImage: `url(${tripImages[post.id] || 'https://via.placeholder.com/250x250?text=Loading'})` }}
                >
                  <div className="trip-info">
                    <h3>{post.body}</h3>
                    <p>Status: {post.status}</p>
                    <p>By: {post.owner?.username || 'Unknown'}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p>You haven’t created any trips yet.</p>
          )}
        </>
      )}

      <h2>{user ? "Others' Posts" : "All Trips"}</h2>
      {othersPosts.length > 0 ? (
        <div className="trip-grid">
          {othersPosts.map(post => (
            <Link
              key={post.id}
              to={`/trips/${post.id}`}
              className="trip-card"
              style={{ backgroundImage: `url(${tripImages[post.id] || 'https://via.placeholder.com/250x250?text=Loading'})` }}
            >
              <div className="trip-info">
                <h3>{post.body}</h3>
                <p>Status: {post.status}</p>
                <p>By: {post.owner?.username || 'Unknown'}</p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p>No trips available yet.</p>
      )}
    </div>
  );
};

export default Splash;