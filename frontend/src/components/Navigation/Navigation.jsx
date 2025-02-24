// frontend/src/components/Navigation.jsx
import { NavLink } from "react-router-dom";
import ProfileButton from "./ProfileButton";
import "./Navigation.css";
import { useSelector, useDispatch } from "react-redux";
import { useEffect } from "react";
import { thunkAuthenticate } from "../../redux/session";
import { restoreCSRF } from "../../redux/csrf"; // Correct path

function Navigation() {
  const dispatch = useDispatch();
  const user = useSelector(state => state.session.user);

  useEffect(() => {
    console.log('Restoring CSRF token');
    restoreCSRF().then(() => {
      console.log('CSRF token restoration complete');
      if (!user) {
        console.log('No user, authenticating');
        dispatch(thunkAuthenticate());
      }
    }).catch(err => {
      console.error('Failed to restore CSRF token:', err);
    });
  }, [dispatch, user]);

  return (
    <ul>
      <li>
        <NavLink to="/">Home</NavLink>
      </li>
      {user && (
        <li>
          <NavLink to="/create-trip">Create Trip</NavLink>
        </li>
      )}
      <li>
        <ProfileButton />
      </li>
    </ul>
  );
}

export default Navigation;