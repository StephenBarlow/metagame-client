import React from 'react';
import { gql, useQuery } from '@apollo/client';
import LogoutButton from './LogoutButton';
import LoginButton from './LoginButton';
import CreateAccountButton from './CreateAccountButton';

const GET_ME = gql`
  query GetMe {
    me @client {
      email
    }
  }
`;

function AccountPanel() {

  const { loading, error, data } = useQuery(GET_ME);
  
  if (loading) return 'Loading...';
  if (error) return `Error! ${error.message}`;

  return (
    <div className="account-panel">
    {data?.me.email ? 
      <>
        <span>You are { data.me.email }</span>
        <LogoutButton/>
      </>
      :
      <>
        <LoginButton/>
        <CreateAccountButton/>
      </>
    }
    </div>
    
  )
}

export default AccountPanel;
