import React from 'react';
import {
  BrowserRouter as Router,
  Link,
  Route,
  Routes,
} from "react-router";
import './App.css';
import { ApolloClient, HttpLink, InMemoryCache, makeVar } from '@apollo/client';
import { ApolloProvider, useReactiveVar } from '@apollo/client/react';

import Home from './components/Home';
import Logo from './components/Logo';

import FantasyLeagueList from './components/FantasyLeagueList';
import AccountPanel from './components/AccountPanel';
import LeagueDetails from './components/LeagueDetails';
import { UserProvider } from './components/ActiveUserContext';

function App() {
  const serverURL = import.meta.env.VITE_SERVER_URL || 'https://metagame.onrender.com';
  const activeUser = makeVar(JSON.parse(localStorage.getItem('activeUser')));
  const loggedIn = useReactiveVar(activeUser);

  const client = new ApolloClient({
    devtools: { enabled: true },
    link: new HttpLink({ uri: serverURL }),
    cache: new InMemoryCache({
      typePolicies: {
        Query: {
          fields: {
            me: {
              read() {
                return activeUser();
              }
            }
          }
        }
      }
    }),
  });

  return (
    <ApolloProvider client={client}>
      <UserProvider value={activeUser}>
        <div className="App">
          <Router>
            <header className="global-header">
              <Logo/>
              <AccountPanel/>
            </header>
            <div className="content">
              <Routes>
                <Route
                  path="/leagues/:id"
                  element={
                    loggedIn
                      ? <LeagueDetails />
                      : <p>You must sign in to view a league's details. <Link to="/">Return to home</Link></p>
                  }
                />
                <Route path="/" element={loggedIn ? <FantasyLeagueList /> : <Home />} />
              </Routes>
            </div>
          </Router>
        </div>
      </UserProvider>
    </ApolloProvider>
  );
}

export default App;
