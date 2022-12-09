import { averageBetween } from './TempoControl'

describe('averageBetween', () => {
  const tests = test.each([
    { input: [3, 4, 5, 6, 7], output: 1 },
    { input: [3, 4], output: 1 },
    { input: [6, 8, 10, 12], output: 2 },
    { input: [10, 15, 20, 30, 40], output: 7.5 },
  ])

  tests('"$input" has "$output" averageBetween', ({ input, output }) => {
    expect(averageBetween(input)).toEqual(output)
  })
})
