import React, { useState } from 'react';
import { gql, useLazyQuery } from '@apollo/client';

const LOG_IN = gql`
  query LogIn($email: String!) {
    user(email: $email) {
      email
    }
  }
`;

function formSubmit(event, login, email) {
  event.preventDefault();
  login({ variables: { "email": email }});
}

function LoginForm() {

  const [email, setEmail] = useState('');
  const [login, { loading, error, data }] = useLazyQuery(LOG_IN);

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
        { error && <>Error logging in</> }
        { data && <>Success!</>}
      </p>
    </>
  );
}

export default LoginForm;
