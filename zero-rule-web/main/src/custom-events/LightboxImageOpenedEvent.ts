import type { Observable } from 'rxjs';
import { Subject } from 'rxjs';

type Payload = { opened: boolean };

const request$ = new Subject<Payload>();

export class LightboxImageOpenedEvent {
  static send = (params: Payload) => {
    request$.next(params);
  };

  static observe = (): Observable<Payload> => {
    return request$.asObservable();
  };
}
