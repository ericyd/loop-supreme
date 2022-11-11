import React from 'react'
import { render, screen } from '@testing-library/react'
import App from '.'

test('renders learn react link', () => {
  render(<App stream={new MediaStream()} />)
  const linkElement = screen.getByText(/learn react/i)
  expect(linkElement).toBeInTheDocument()
})
