import { BehaviorSubject, Observable } from 'rxjs';

type SetValueFn<T> = (prev: T) => T;

export class ObservableField<T> {
  private field$: BehaviorSubject<T>;

  constructor(value: T) {
    this.field$ = new BehaviorSubject(value);
  }

  observe = (): Observable<T> => this.field$; // .asObservable()

  get value(): T {
    return this.field$.value;
  }

  setValue = (value: SetValueFn<T> | T) => {
    let newValue: T;
    if (typeof value === 'function') {
      const valueFn = value as SetValueFn<T>;
      newValue = valueFn(this.field$.value);
    } else {
      newValue = value;
    }

    if (newValue !== this.field$.value) {
      this.field$.next(newValue);
    }
  };
}

export class ObservableBooleanField extends ObservableField<boolean> {
  toggle = (value?: boolean) => {
    if (typeof value === 'boolean') {
      this.setValue(value);
    } else {
      const newValue = !this.value;
      this.setValue(newValue);
    }
  };
}
