import config from '@/config';
import Router from 'next/router';
import urljoin from 'url-join';
import urlParse from 'url-parse';

const { apiBaseURL = '', routerBaseURL = '', baseURL } = config;

// 로컬 모드에서는 CONFIG_ROUTER_PATH = '' or '/'
// 서버에서는 요런식으로 된다. CONFIG_ROUTER_PATH = '/flawing/web-admin'
const CONFIG_ROUTER_PATH = () => {
  if (!routerBaseURL) return '';
  return urlParse(routerBaseURL, true).pathname;
};

export function routerFullUrlOf(path: string): string {
  return urljoin(baseURL, path);
}

export function routerUrlOf(path: string): string {
  const routerPath = CONFIG_ROUTER_PATH();
  if (path === undefined || path === null) {
    return '/';
  }

  if (!routerPath || routerPath === '/') return path;
  return `${routerPath}${path && path.startsWith('/') ? '' : '/'}${path}`;
}

export const routerPush = (path: string): void => {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    Router.push(path);
  } else {
    const url = routerUrlOf(path);
    Router.push(path, url);
  }
};

export const routerBack = (): void => {
  Router.back();
};

export const apiUrlOf = (path: string): string => {
  return urljoin(apiBaseURL, path);
};
