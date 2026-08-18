export interface HoleScore {
  relativeToPar: number;
  label: string;
  display: string;
}

export function scoreHole(strokes: number, par: number): HoleScore {
  const safeStrokes = Math.max(1, Math.round(strokes));
  const safePar = Math.max(1, Math.round(par));
  const relativeToPar = safeStrokes - safePar;

  let label: string;
  if (safeStrokes === 1) {
    label = 'HOLE IN ONE';
  } else if (relativeToPar <= -2) {
    label = 'EAGLE';
  } else if (relativeToPar === -1) {
    label = 'BIRDIE';
  } else if (relativeToPar === 0) {
    label = 'PAR';
  } else if (relativeToPar === 1) {
    label = 'BOGEY';
  } else if (relativeToPar === 2) {
    label = 'DOUBLE BOGEY';
  } else if (relativeToPar === 3) {
    label = 'TRIPLE BOGEY';
  } else {
    label = `${relativeToPar} OVER PAR`;
  }

  return {
    relativeToPar,
    label,
    display:
      relativeToPar === 0
        ? 'E'
        : relativeToPar > 0
          ? `+${relativeToPar}`
          : `${relativeToPar}`,
  };
}
