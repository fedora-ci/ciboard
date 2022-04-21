import React from 'react';
import { Provider } from 'react-redux';
import { render, screen } from '@testing-library/react';

import { store } from '../reduxStore';
import { App } from './App';

test('renders learn react link', () => {
    render(
        <Provider store={store}>
            <React.StrictMode>
                <App />
            </React.StrictMode>
        </Provider>,
    );
    const logoElement = screen.getByText(/CI Dashboard/i);
    expect(logoElement).toBeInTheDocument();
});
