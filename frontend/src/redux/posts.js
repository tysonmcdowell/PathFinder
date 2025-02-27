// frontend/src/redux/posts.js
import { csrfFetch } from "./csrf";

const LOAD_POSTS = 'posts/loadPosts';
const CREATE_POST = 'posts/createPost';

const loadPosts = (posts) => ({
  type: LOAD_POSTS,
  posts
});

const createPost = (post) => ({
  type: CREATE_POST,
  post
});

export const loadPostsThunk = () => async (dispatch) => {
  const response = await csrfFetch('/api/posts');
  const data = await response.json();
  dispatch(loadPosts(data.Posts));
  return response;
};

export const createPostThunk = (postData) => async (dispatch) => {
    console.log('Thunk received postData:', postData); // Debug log
    const response = await csrfFetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postData)
    });
    if (response.ok) {
      const newPost = await response.json();
      dispatch({ type: 'posts/addPost', payload: newPost });
      return newPost;
    } else {
      const error = await response.json();
      throw new Error(error.message);
    }
  };

const postsReducer = (state = {}, action) => {
  switch (action.type) {
    case LOAD_POSTS: {
      const newState = {};
      action.posts.forEach(post => {
        newState[post.id] = post;
      });
      return newState;
    }
    case CREATE_POST:
      return { ...state, [action.post.id]: action.post };
    default:
      return state;
  }
};

export default postsReducer;