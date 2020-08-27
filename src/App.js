import React from 'react';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  useParams
} from "react-router-dom";

import './App.css';
import { ApolloClient, InMemoryCache, ApolloProvider, makeVar } from '@apollo/client'

import Logo from './components/Logo';
import FantasyLeagueList from './components/FantasyLeagueList';
import PickGrid from './components/PickGrid';
import AccountPanel from './components/AccountPanel';
import { UserProvider } from './components/ActiveUserContext';

function App() {

  const serverURL = process.env.REACT_APP_SERVER_URL || 'http://localhost:4000';
  const activeUser = makeVar(localStorage.getItem('activeUser'));

  const client = new ApolloClient({
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
          <Router>
            <header className="global-header">
              <Logo/>
              <AccountPanel/>
            </header>
            <Switch>
              <Route path="/leagues/:id">
                <PickGrid/>
              </Route>
              <Route path="/">
                <div className="content">
                  <FantasyLeagueList/>
                </div>
              </Route>
            </Switch>
          </Router>
        </div>
      </UserProvider>
    </ApolloProvider>
  );
}

export default App;
