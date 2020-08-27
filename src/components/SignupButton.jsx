import React, { Component } from 'react';
import Modal from './Modal';
import SignupForm from './SignupForm';

class SignupButton extends Component {

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
        <a onClick={this.showModal}> Register </a>
        <Modal show={this.state.show} handleClose={this.hideModal}>
          <SignupForm/>
        </Modal>
      </>
    );
  }
}

export default SignupButton;
