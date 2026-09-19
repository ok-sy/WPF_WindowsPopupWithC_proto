export function queryParam(value: string | string[] | null | undefined): string | undefined {
  if (typeof value === 'undefined' || value === null) return undefined;
  if (Array.isArray(value)) {
    return value[0];
  } else {
    return value;
  }
}
