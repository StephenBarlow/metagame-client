import React from 'react';
import { gql, useQuery } from '@apollo/client';

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

  return (
    <>
      <a> Create Account </a>
    </>
  )
}

export default CreateAccountButton;
