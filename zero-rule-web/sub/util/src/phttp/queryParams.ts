export function queryParams(value: string | string[] | null | undefined): string[] | undefined {
  if (typeof value === 'undefined' || value === null) return undefined;
  if (Array.isArray(value)) {
    return value;
  } else {
    return [value];
  }
}
