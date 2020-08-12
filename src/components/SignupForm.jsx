import React, { useState } from 'react';
import { gql, useMutation } from '@apollo/client';

const SIGN_UP = gql`
mutation CreateUser($request: CreateUserRequest!) {
  createUser(request: $request) {
    user {
      id
      email
    }
    errors {
      code
      message
    }
  }
}
`;

function formSubmit(event, signup, email) {
  event.preventDefault();
  signup({ variables: { "request": {
    email: email
  } }});
}

function SignupForm() {

  const [email, setEmail] = useState('');
  const [signup, { loading, error, data }] = useMutation(SIGN_UP);

  return (
    <>
      <h3>Create account</h3>
      <form onSubmit={(event) => formSubmit(event, signup, email) }>
        <label>
          Email:
        </label>
        <input type="text" id="signup-email" placeholder="donovan@chunkysoup.com" onChange={event => setEmail(event.target.value)} />
        <input type="submit" />
      </form>
      <p className="form-status">
        { loading && <>Loading...</> }
        { error && <>Error logging in</> }
        { data?.errors && <> { data.errors[0].message } </> }
        { data?.user && <> { data.user.email } </> }
      </p>
    </>
  );
}

export default SignupForm;
