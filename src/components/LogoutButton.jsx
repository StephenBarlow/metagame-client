import React, { useContext } from 'react';
import UserContext from './ActiveUserContext';

function LogoutButton() {

  const activeUser = useContext(UserContext);

  const signOut = function({ createUser }) {  
    activeUser(null);
    localStorage.removeItem('activeUser');
  };

  return(
    <>
      <a onClick={signOut}> Sign out </a>
    </>
  );
}

export default LogoutButton;
