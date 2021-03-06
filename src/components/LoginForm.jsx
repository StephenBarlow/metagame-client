import React, { useState, useContext } from 'react';
import { gql, useLazyQuery } from '@apollo/client';
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

function storeActiveUser({ user }){
  if (!user) {
    return;
  } else {
    
  }
}

function LoginForm() {

  // Keeping track of the address entered in the form
  const [email, setEmail] = useState('');
  const activeUser = useContext(UserContext);

  const signIn = function({ user }) {
    if (user) {
      activeUser(user.email);
      localStorage.setItem('activeUser', user.email);
    }
  };
  
  const [login, { loading, error, data }] = useLazyQuery(
    LOG_IN,
    {
      onCompleted: signIn
    }
  );

  return (
    <>
      <h3>Sign in</h3>
      <form onSubmit={(event) => formSubmit(event, login, email) }>
        <label>
          Email:
        </label>
        <input type="text" id="login-email" placeholder="donovan@chunkysoup.com" onChange={event => setEmail(event.target.value)} />
        <input type="submit" />
      </form>
      <p className="form-status">
        { loading && <>Loading...</> }
        { error && <>Server error logging in</> }
        { data?.user?.email && <>Success!</>}
      </p>
    </>
  );
}

export default LoginForm;
