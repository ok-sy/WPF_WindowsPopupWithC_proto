import * as yup from 'yup';
import { Message } from 'yup/lib/types';

declare module 'yup' {
  interface StringSchema extends yup.StringSchema<string> {
    noWhitespace(message?: Message): StringSchema<string>;
  }
}
