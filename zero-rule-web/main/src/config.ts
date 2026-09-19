import getConfig from 'next/config';

const { publicRuntimeConfig } = getConfig();

const apiBaseURL = publicRuntimeConfig.API_BASE_URL ?? '';

const cfg = {
  httpHeaderKeys: {
    token: publicRuntimeConfig.HTTP_TOKEN_HEADER,
    tokenClear: publicRuntimeConfig.HTTP_TOKEN_CLEAR_HEADER,
  },
  apiBaseURL,
  routerBaseURL: publicRuntimeConfig.ROUTER_BASE_URL,
  baseURL: publicRuntimeConfig.BASE_URL,
  debug: !!publicRuntimeConfig.DEBUG,
};

// log.debug('config=', cfg)
export default cfg;
