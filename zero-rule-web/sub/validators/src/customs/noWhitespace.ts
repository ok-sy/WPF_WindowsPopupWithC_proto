import * as yup from 'yup';
import { Message } from 'yup/lib/types';

yup.addMethod<yup.StringSchema>(yup.string, 'noWhitespace', function (message?: Message) {
  return this.test({
    message: message ?? 'whitespace not allowed',
    name: 'no-whitespace',
    test: (value) => !value || !/\s/.test(value),
  });
});
