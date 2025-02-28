// frontend/src/components/SignupFormModal/SignupFormModal.jsx
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useModal } from '../../context/Modal';
import * as sessionActions from '../../redux/session';
import './SignupForm.css';

function SignupFormModal() {
  const dispatch = useDispatch();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const { closeModal } = useModal();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    // Email validation
    if (/\s/.test(email)) {
      return setErrors({ email: 'Email cannot contain spaces' });
    }
    if (!email.includes('@') || !email.includes('.') || email.length < 5) {
      return setErrors({ email: 'Please enter a valid email (e.g., user@domain.com)' });
    }
    if (email.length > 255) {
      return setErrors({ email: 'Email must be 255 characters or less' });
    }

    // Username validation
    if (/\s/.test(username)) {
      return setErrors({ username: 'Username cannot contain spaces' });
    }
    if (username.length < 4) {
      return setErrors({ username: 'Username must be at least 4 characters' });
    }
    if (username.length > 30) {
      return setErrors({ username: 'Username must be 30 characters or less' });
    }
    if (!/^[a-zA-Z0-9]+$/.test(username)) {
      return setErrors({ username: 'Username must contain only letters and numbers' });
    }

    // Password validation
    if (password.length < 6) {
      return setErrors({ password: 'Password must be at least 6 characters' });
    }
    if (password.length > 50) {
      return setErrors({ password: 'Password must be 50 characters or less' });
    }
    if (password !== confirmPassword) {
      return setErrors({ message: 'Passwords do not match' });
    }

    const signupData = {
      email,
      username,
      firstName,
      lastName,
      password,
    };

    try {
      const response = await dispatch(sessionActions.thunkSignup(signupData));
      if (!response) { // thunkSignup returns null on success
        closeModal();
      } else {
        setErrors(response.errors || { message: 'Signup failed. Email or Username not unique.' });
      }
    } catch (err) {
      setErrors({ message: 'Signup failed. Email or Username not unique.' });
      console.error(err);
    }
  };

  return (
    <div className="signup-modal">
      <h1>Sign Up</h1>
      {errors.message && <p className="error">{errors.message}</p>}
      <form onSubmit={handleSubmit}>
        <label>
          Email
          <input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        {errors.email && <p className="error">{errors.email}</p>}
        <label>
          Username
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </label>
        {errors.username && <p className="error">{errors.username}</p>}
        <label>
          First Name
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
        </label>
        {errors.firstName && <p className="error">{errors.firstName}</p>}
        <label>
          Last Name
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
        </label>
        {errors.lastName && <p className="error">{errors.lastName}</p>}
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {errors.password && <p className="error">{errors.password}</p>}
        <label>
          Confirm Password
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </label>
        {errors.confirmPassword && <p className="error">{errors.confirmPassword}</p>}
        <button type="submit">Sign Up</button>
      </form>
    </div>
  );
}

export default SignupFormModal;