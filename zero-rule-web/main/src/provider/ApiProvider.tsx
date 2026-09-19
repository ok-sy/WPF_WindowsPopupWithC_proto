import config from '@/config';
import { UserMainApi } from '@local/domain';
import React, { createContext, useContext } from 'react';
import { apiResponseInterceptor, errorResponseInterceptor } from './apiResponseInterceptor';
import createApiHeader from './createApiHeader';

export const api = new UserMainApi(
  config.apiBaseURL,
  createApiHeader,
  //@ts-ignore
  apiResponseInterceptor,
  errorResponseInterceptor,
);
export const useApi = () => api;

// export const ApiContext = createContext(api)

/**
 * API hook
 */

// type Props = {
//   children?: React.ReactNode
// }

// /**
//  * api provider
//  */
// export default function ApiProvider(props: Props) {
//   const { children } = props
//   return <ApiContext.Provider value={api}>{children}</ApiContext.Provider>
// }
