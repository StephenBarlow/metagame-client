import React from 'react';
import { gql, useQuery } from '@apollo/client';

const GET_ME = gql`
  query GetMe {
    me @client {
      email
    }
  }
`;

const CREATE_USER = gql`
  mutation CreateUser($request: CreateUserRequest!) {
    createUser(request: $request) {
      user {
        email
      }
      errors {
        code
        message
      }
    }
  }
`;

function CreateAccountButton() {

  const { loading, error, data } = useQuery(GET_ME);

  const isLoggedIn = !!(data?.me.email);
  
  if (loading) return 'Loading...';
  if (error) return `Error! ${error.message}`;

  return (
    <div>
      {isLoggedIn
        ? <button disabled> Create Account </button>
        : <button> Create Account </button>
      }
    </div>
  )
}

export default CreateAccountButton;
