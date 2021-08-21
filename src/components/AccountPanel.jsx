import React, { useContext } from 'react';
import LogoutButton from './LogoutButton';
import LoginButton from './LoginButton';
import SignupButton from './SignupButton';
import UserContext from './ActiveUserContext';

function AccountPanel() {

  const activeUser = useContext(UserContext);

  return (
    <div className="account-panel">
    {activeUser() ? 
      <>
        <span className="active-user"><strong>{ activeUser().email }</strong></span>
        <LogoutButton/>
      </>
      :
      <>
        <LoginButton/>
      </>
    }
    </div>
    
  )
}

export default AccountPanel;
