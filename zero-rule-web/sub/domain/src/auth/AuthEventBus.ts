import { BehaviorSubject, Observable } from 'rxjs';

export class AuthEventBus<T> {
  private event$ = new BehaviorSubject<T | undefined | null>(undefined);

  constructor(initialValue?: T | null) {
    this.event$.next(initialValue);
  }

  observe = (): Observable<T | undefined | null> => {
    return this.event$ as Observable<T | undefined | null>;
  };

  send = (data: T | undefined | null) => {
    this.event$.next(data ?? null);
  };
}
