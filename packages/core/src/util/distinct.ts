export function distinct(a: any, b: any): boolean {
  return a === b ? false
    : a instanceof Date && b instanceof Date ? +a !== +b
    : Array.isArray(a) && Array.isArray(b) ? distinctArray(a, b)
    : true;
}

export function distinctArray(a: any[], b: any[]): boolean {
  if (a.length !== b.length) return true;
  for (let i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return true;
  }
  return false;
}