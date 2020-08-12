import React from 'react';
import './App.css';
import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client'

import FantasyLeagueList from './components/FantasyLeagueList';
import PickGrid from './components/PickGrid';
import AccountPanel from './components/AccountPanel';
import CreateAccountButton from './components/CreateAccountButton';

function App() {

  const serverURL = process.env.REACT_APP_SERVER_URL || 'http://localhost:4000';

  const client = new ApolloClient({
    uri: serverURL,
    cache: new InMemoryCache()
  });

  return (
    <ApolloProvider client={client}>
      <div className="App">
        <header className="global-header">
          <AccountPanel/>
        </header>
        <div className="content">
          <PickGrid/>
        </div>
      </div>
    </ApolloProvider>
  );
}

export default App;
