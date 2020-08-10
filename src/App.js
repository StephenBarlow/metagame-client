import React from 'react';
import logo from './logo.svg';
import './App.css';
import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client'
import FantasyLeagueList from './components/FantasyLeagueList';
import PickGrid from './components/PickGrid';

function App() {

  const client = new ApolloClient({
    uri: 'http://localhost:4000',
    cache: new InMemoryCache()
  });

  return (
    <ApolloProvider client={client}>
      <div className="App">
        <header className="App-header">
          <PickGrid/>
        </header>
      </div>
    </ApolloProvider>
  );
}

export default App;
