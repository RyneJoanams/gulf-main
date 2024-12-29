import React from 'react';
import { render, screen } from '@testing-library/react';
import Hero from './Hero';

test('renders Hero component', () => {
    render(<Hero />);
    const linkElement = screen.getByText(/hero/i);
    expect(linkElement).toBeInTheDocument();
});