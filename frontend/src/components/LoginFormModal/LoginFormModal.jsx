import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useModal } from '../../context/Modal';
import * as sessionActions from '../../redux/session';
import './LoginForm.css';

function LoginFormModal() {
  const dispatch = useDispatch();
  const [credential, setCredential] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const { closeModal } = useModal();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    if (/\s/.test(credential)) {
      return setErrors({ credential: 'Username or email cannot contain spaces' });
    }

    const loginData = { email: credential, password };

    try {
      const response = await dispatch(sessionActions.thunkLogin(loginData));
      if (!response) { 
        closeModal();
      } else {
        setErrors({ message: 'Username/Email or password is incorrect' });
      }
    } catch (err) {
      setErrors({ message: 'Username/Email or password is incorrect' });
      console.error(err);
    }
  };

  const handleDemoLogin = async (e) => {
    e.preventDefault();
    setErrors({});
    setCredential('demo@user.io');
    setPassword('password');

    const loginData = { email: 'demo@user.io', password: 'password' };

    try {
      const response = await dispatch(sessionActions.thunkLogin(loginData));
      if (!response) {
        closeModal();
      } else {
        setErrors({ message: 'Demo login failed: Username/Email or password is incorrect' });
      }
    } catch (err) {
      setErrors({ message: 'Demo login failed: Username/Email or password is incorrect' });
      console.error(err);
    }
  };

  return (
    <div className="login-modal">
      <h1>Log In</h1>
      {errors.message && <p className="error">{errors.message}</p>}
      <form onSubmit={handleSubmit}>
        <label>
          Email or Username
          <input
            type="text"
            value={credential}
            onChange={(e) => setCredential(e.target.value)}
            required
          />
        </label>
        {errors.credential && <p className="error">{errors.credential}</p>}
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
        <button type="submit">Log In</button>
        <button type="button" onClick={handleDemoLogin}>Demo Login</button>
      </form>
    </div>
  );
}

export default LoginFormModal;