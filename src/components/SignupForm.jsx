import React, { useState, useContext } from 'react';
import { gql, useMutation } from '@apollo/client';
import LoginButton from './LoginButton';
import UserContext from './ActiveUserContext';

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

const formSubmit = function(event, signup, email) {
  event.preventDefault();
  signup({ variables: { "request": {
    email: email
  } }});
};

function SignupForm() {

  const [email, setEmail] = useState('');
  const [message, setMessage] = useState(null);
  const activeUser = useContext(UserContext);

  const signIn = function({ createUser }) {
    if (createUser?.user) {
      activeUser(createUser.user.email);
      localStorage.setItem('activeUser',createUser.user.email);
    }

    if (createUser?.errors?.length > 0) {
      setMessage(createUser.errors[0].message);
    }
  };

  const [signup, { loading, error, data }] = useMutation(
    SIGN_UP,
    {
      onCompleted: signIn
    }
  );

  return (
    <>
      <h3>Register</h3>
      <form onSubmit={(event) => formSubmit(event, signup, email) }>
        <label>
          Email:
        </label>
        <input type="text" id="signup-email" placeholder="donovan@chunkysoup.com" onChange={event => setEmail(event.target.value)} />
        <input type="submit" />
      </form>
      <p className="form-status">
        { loading && <>Loading...</> }
        { error && <>Server error while creating account</> }
        { message && <> { message } </> }
      </p>
    </>
  );
}

export default SignupForm;
