import React, { useState, useContext, useEffect } from 'react';
import { gql } from '@apollo/client';
import { useLazyQuery } from '@apollo/client/react';
import { useNavigate } from 'react-router';
import UserContext from './ActiveUserContext';

const LOG_IN = gql`
  query LogIn($email: String!) {
    user(email: $email) {
      id
      email
    }
  }
`;

function formSubmit(event, login, email) {
  event.preventDefault();
  login({ variables: { "email": email }});
}

function LoginForm() {

  // Keeping track of the address entered in the form
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState(null);
  const activeUser = useContext(UserContext);
  const navigate = useNavigate();

  const [login, { loading, error, data }] = useLazyQuery(LOG_IN);

  useEffect(() => {
    if (!data?.user) {
      return;
    }

    setMessage('Login successful! Loading...');
    const timeoutId = setTimeout(() => {
      activeUser(data.user);
      localStorage.setItem('activeUser', JSON.stringify(data.user));
      navigate('/', { replace: true });
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [activeUser, data, navigate]);

  return (
    <>
      <h3>Please sign in with your email</h3>
      <form onSubmit={(event) => formSubmit(event, login, email) }>
        <label>
          Email:
        </label>
        <input type="text" id="login-email" placeholder="donovan@chunkysoup.com" onChange={event => setEmail(event.target.value)} />
        <input id="login-submit" type="submit" />
      </form>
      <p className="form-status">
        { loading && <>Logging in...</> }
        { error && <>Server error logging in</> }
        { data && !data.user && <>User not found!</>}
        { message && <>{message}</>}
      </p>
    </>
  );
}

export default LoginForm;
