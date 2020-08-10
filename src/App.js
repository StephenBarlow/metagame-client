import React from 'react';
import './App.css';
import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client'

import FantasyLeagueList from './components/FantasyLeagueList';
import PickGrid from './components/PickGrid';
import AccountPanel from './components/AccountPanel';
import CreateAccountButton from './components/CreateAccountButton';

function App() {

  const client = new ApolloClient({
    uri: 'http://localhost:4000',
    cache: new InMemoryCache()
  });

  return (
    <ApolloProvider client={client}>
      <div className="App">
        <header className="App-header">
          <CreateAccountButton/>
          <AccountPanel/>
          <PickGrid/>
        </header>
      </div>
    </ApolloProvider>
  );
}

export default App;
