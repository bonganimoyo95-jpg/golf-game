export function isQaMode(search?: string): boolean {
  const query =
    search ?? (typeof window === 'undefined' ? '' : window.location.search);
  const value = new URLSearchParams(query).get('qa');
  return value === '1' || value === 'true';
}
