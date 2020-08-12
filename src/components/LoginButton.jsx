import React, { Component } from 'react';
import Modal from './Modal';
import LoginForm from './LoginForm';

class LoginButton extends Component {

  state = { show: false };

  showModal = () => {
    this.setState({ show: true });
  };

  hideModal = () => {
    this.setState({ show: false });
  };

  render() {
    return(
      <>
        <a onClick={this.showModal}> Sign in </a>
        <Modal show={this.state.show} handleClose={this.hideModal}>
          <LoginForm/>
        </Modal>
      </>
    );
  }
}

export default LoginButton;
