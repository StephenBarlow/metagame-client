import React from 'react';
import { render } from '@testing-library/react';
import App from './App';

test('renders the welcome message', () => {
  const { getByText } = render(<App />);
  const welcomeMessage = getByText(/welcome to pick 2/i);
  expect(welcomeMessage).toBeInTheDocument();
});
