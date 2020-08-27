import React from 'react';
import { gql, useQuery } from '@apollo/client';
import LogoutButton from './LogoutButton';
import LoginButton from './LoginButton';
import SignupButton from './SignupButton';

const GET_ME = gql`
  query GetMe {
    me @client
  }
`;

function AccountPanel() {

  const { loading, error, data } = useQuery(GET_ME);
  
  if (loading) return 'Loading...';
  if (error) return `Error! ${error.message}`;

  return (
    <div className="account-panel">
    {data?.me ? 
      <>
        <span>Playing as <strong>{ data.me }</strong></span>
        <LogoutButton/>
      </>
      :
      <>
        <LoginButton/>
        <SignupButton/>
      </>
    }
    </div>
    
  )
}

export default AccountPanel;
