import { constructPath } from './waveform'

describe('constructPath', () => {
  it('returns a path with smooth cubic bezier points', () => {
    const actual = constructPath({
      frames: [0.1, 0.2, 0.15],
      framesPerLoop: 4,
      xMax: 4,
      minGain: 0.1,
      maxGain: 0.2,
      yMin: 0,
      yMax: 1,
    })
    const expected = [
      'M 0 0',
      // x offset is 0.5 b/c framesPerLoop/xMax/2 = 0.5
      'S 0.5,1 1,1',
      'S 1.5,0.5 2,0.5',
      // this is an interesting effect; ideally there wouldn't be this "bump" (2.5) on the first negative path. Might want to consider changing that
      'S 2.5,-0.5 2,-0.5',
      'S 1.5,-1 1,-1',
      'S 0.5,0 0,0',
      'Z',
    ].join(' ')
    expect(actual).toBe(expected)
  })
})
