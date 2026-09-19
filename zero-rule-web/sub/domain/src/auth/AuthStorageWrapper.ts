type SerializeFn<T> = (value: T) => string;
type DeserializeFn<T> = (value: string) => T;
type StorageProvider = () => Storage;

const isNotNullish = <T>(value: T | undefined | null): value is T => {
  return typeof value !== 'undefined' && value !== null;
};

export class AuthStorageWrapper<T> {
  private storage_: StorageProvider;
  private storageKey_: string;
  private serialize_: SerializeFn<T>;
  private deserialize_: DeserializeFn<T>;

  constructor(options: {
    storage: StorageProvider;
    storageKey: string;
    serialize: SerializeFn<T>;
    deserialize: DeserializeFn<T>;
  }) {
    this.storage_ = options.storage;
    this.storageKey_ = options.storageKey;
    this.serialize_ = options.serialize;
    this.deserialize_ = options.deserialize;
  }

  clear = () => {
    this.storage_().removeItem(this.storageKey_);
  };

  get = (): T | undefined => {
    const value = this.storage_().getItem(this.storageKey_);
    if (isNotNullish(value) && value.length > 0) {
      try {
        return this.deserialize_(value);
      } catch (ignore) {
        console.trace(ignore);
      }
    }
    return undefined;
  };

  exists = (): boolean => {
    const value = this.storage_().getItem(this.storageKey_);
    const result = (value?.length ?? 0) > 0;
    return result;
  };

  save = (value: T | null | undefined) => {
    if (isNotNullish(value)) {
      this.storage_().setItem(this.storageKey_, this.serialize_(value));
    } else {
      this.storage_().removeItem(this.storageKey_);
    }
  };
}
