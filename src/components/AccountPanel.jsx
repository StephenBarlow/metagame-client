import React from 'react';
import { gql, useQuery } from '@apollo/client';

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
    <div>
    {data?.me.email ? 
      <span>{ data.me.email }</span>
      :
      <span>You are signed out.</span>
    }
    </div>
  )
}

export default AccountPanel;
