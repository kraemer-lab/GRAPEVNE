import '@testing-library/jest-dom';
import { fireEvent, render } from '@testing-library/react';
import React from 'react';
import { DropdownMenu } from '../components/DropdownMenu';

describe('DropdownMenu Component', () => {
  test('renders the component with correct label', () => {
    const { getByText } = render(
      <DropdownMenu label="Dropdown Menu">
        <div>Child 1</div>
        <div>Child 2</div>
      </DropdownMenu>,
    );
    expect(getByText('Dropdown Menu')).toBeInTheDocument();
  });

  test('calls onClick handler when clicked', () => {
    const { getByText } = render(
      <DropdownMenu label="Dropdown Menu">
        <div>Child 1</div>
        <div>Child 2</div>
      </DropdownMenu>,
    );
    fireEvent.click(getByText('Dropdown Menu'));
  });
});
