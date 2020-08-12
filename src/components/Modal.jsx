import React from 'react';

function Modal({ handleClose, show, children }) { 
  const showHideClassName = show ? "modal modal-active" : "modal";

  return (
    <div className={showHideClassName}>
      <section className="modal-main">
        { children }
      </section>
    </div>
  );
}

export default Modal;
