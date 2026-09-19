import { AuthStorageWrapper } from './AuthStorageWrapper';
import { AuthEventBus } from './AuthEventBus';

type SerializeFn<T> = (value: T) => string;
type DeserializeFn<T> = (value: string) => T;
type StorageProvider = () => Storage;

const createEventBus = <T>(initialValue?: T | null): AuthEventBus<T> => {
  return new AuthEventBus(initialValue);
};

const createStorage = <T>(options: {
  storage: StorageProvider;
  storageKey: string;
  serialize?: SerializeFn<T>;
  deserialize?: DeserializeFn<T>;
}) => {
  const opts = {
    serialize: JSON.stringify,
    deserialize: JSON.parse,
    ...options,
  };
  return new AuthStorageWrapper<T>(opts);
};

export const Authentication = {
  StorageWrapper: AuthStorageWrapper,
  createEventBus,
  createStorage,
};
