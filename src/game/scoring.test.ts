import { describe, expect, it } from 'vitest';
import { scoreHole } from './scoring';

describe('hole scoring', () => {
  it('labels a score under par', () => {
    expect(scoreHole(3, 4)).toEqual({
      relativeToPar: -1,
      label: 'BIRDIE',
      display: '-1',
    });
  });

  it('labels par as even', () => {
    expect(scoreHole(4, 4)).toEqual({
      relativeToPar: 0,
      label: 'PAR',
      display: 'E',
    });
  });

  it('labels common over-par results', () => {
    expect(scoreHole(5, 4).label).toBe('BOGEY');
    expect(scoreHole(6, 4).label).toBe('DOUBLE BOGEY');
    expect(scoreHole(8, 4).display).toBe('+4');
  });
});
