import { csrfFetch } from './csrf';

// Constants
const SET_USER = 'session/setUser';
const REMOVE_USER = 'session/removeUser';

const setUser = (user) => ({
  type: SET_USER,
  payload: user
});

const removeUser = () => ({
  type: REMOVE_USER
});

export const thunkAuthenticate = () => async (dispatch) => {
  try {
    console.log('Authenticating user via /api/session');
    const response = await csrfFetch("/api/session"); 
    if (response.ok) {
      const data = await response.json();
      console.log('Authenticated user:', data);
      if (data.user) dispatch(setUser(data.user));
    }
  } catch (e) {
    console.error('Authentication error:', e);
    return e;
  }
};

export const thunkLogin = ({ email, password }) => async dispatch => {
  console.log('Logging in:', { email, password });
  const response = await csrfFetch("/api/session", {
    method: "POST",
    body: JSON.stringify({ credential: email, password })
  });

  if (response.ok) {
    const data = await response.json();
    console.log('Login success:', data);
    dispatch(setUser(data.user));
    return null; // Success
  } else if (response.status < 500) {
    const errorMessages = await response.json();
    console.log('Login failed:', errorMessages);
    return errorMessages;
  } else {
    const error = { server: "Something went wrong. Please try again" };
    console.log('Login error:', error);
    return error;
  }
};

export const thunkSignup = (user) => async (dispatch) => {
  console.log('Signing up:', user);
  const response = await csrfFetch("/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user)
  });

  if (response.ok) {
    const data = await response.json();
    console.log('Signup success:', data);
    dispatch(setUser(data.user));
    return null;
  } else if (response.status < 500) {
    const errorMessages = await response.json();
    console.log('Signup failed:', errorMessages);
    return errorMessages;
  } else {
    const error = { server: "Something went wrong. Please try again" };
    console.log('Signup error:', error);
    return error;
  }
};

export const thunkLogout = () => async (dispatch) => {
  console.log('Logging out');
  await csrfFetch("/api/session", {
    method: "DELETE",
  });
  dispatch(removeUser());
};

const initialState = { user: null };

function sessionReducer(state = initialState, action) {
  switch (action.type) {
    case SET_USER:
      console.log('Setting user:', action.payload);
      return { ...state, user: action.payload };
    case REMOVE_USER:
      console.log('Removing user');
      return { ...state, user: null };
    default:
      return state;
  }
}

export default sessionReducer;