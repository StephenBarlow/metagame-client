import React from 'react';
import {
  BrowserRouter as Router,
  Switch,
  Route,
} from "react-router-dom";
import {Helmet} from "react-helmet";
import './App.css';
import { ApolloClient, InMemoryCache, ApolloProvider, makeVar, useReactiveVar } from '@apollo/client'

import Home from './components/Home';
import Logo from './components/Logo';

import FantasyLeagueList from './components/FantasyLeagueList';
import AccountPanel from './components/AccountPanel';
import LeagueDetails from './components/LeagueDetails';
import { UserProvider } from './components/ActiveUserContext';

function App() {
  const serverURL = process.env.REACT_APP_SERVER_URL || 'http://localhost:4000';
  const activeUser = makeVar(JSON.parse(localStorage.getItem('activeUser')));
  const loggedIn = useReactiveVar(activeUser);

  const client = new ApolloClient({
    connectToDevTools: true,
    uri: serverURL,
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
          <Helmet>
            <meta charSet="utf-8" />
            <title>NFL Pick 2</title>
          </Helmet>
          <Router>
            <header className="global-header">
              <Logo/>
              <AccountPanel/>
            </header>
            <div className="content">
              <Switch>
                <Route path="/leagues/:id">
                  { loggedIn
                    ? <LeagueDetails />
                    : <p>You must sign in to view a league's details. <a href="/">Return to home</a></p>
                  }
                </Route>
                <Route exact path="/">
                  { loggedIn
                    ? <FantasyLeagueList/>
                    : <Home/>
                  }
                </Route>
              </Switch>
            </div>
          </Router>
        </div>
      </UserProvider>
    </ApolloProvider>
  );
}

export default App;
