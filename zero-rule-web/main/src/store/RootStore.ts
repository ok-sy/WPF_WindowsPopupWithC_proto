import log from '@/log';
import MainLayoutStore from './MainLayoutStore';
import type { RootStoreInitialState } from './types';

/**
 * @class Mobx 루트 스토어
 */
export class RootStore {
  mainLayoutStore = new MainLayoutStore();

  /**
   * hydrate
   */
  hydrate = (data: RootStoreInitialState | null | undefined) => {
    log.debug('store hydrate:', data);
    // this.intlStore.hydrate(data?.intlStoreData)
    // add other stores
  };
}
