import md5 from 'crypto-js/md5';

const baseId = md5(`${Math.random()}`).toString();
let seq = Math.floor(Math.random() * 10000);

export function genId(prefix = ''): string {
  return `${prefix}${baseId}_${++seq}_`;
}
