import { CLUserStateKey } from '@local/domain';
import * as yup from 'yup';

export type UserUpdateSchemaType = {
  userName: string; //
  bryyMndy: string; //
  userTno1: string; //
  userTno2: string; //
  userExno1?: string; //
  userExno2?: string; //
  memo?: string; //
};

/**
 * form validation schema for login
 */
export const userUpdateSchema: yup.SchemaOf<UserUpdateSchemaType> = yup.object().shape({
  userName: yup.string().required('로그인ID를 입력해주세요'),
  bryyMndy: yup
    .string()
    .required('생년월일을 입력해주세요')
    .length(6, '6글자 형식으로 입력해주세요. ex) 980328'),
  userTno1: yup
    .string()
    .required('전화번호 입력')
    .matches(/^\d+$/, '숫자만 가능')
    .length(4, '최대 4글자로 입력해주세요'),
  userTno2: yup
    .string()
    .required('전화번호 입력')
    .matches(/^\d+$/, '숫자만 가능')
    .length(4, '최대 4글자로 입력해주세요'),
  userExno1: yup.string().matches(/^\d+$/, '숫자만 가능').length(3, '최대 3글자'),
  userExno2: yup.string().matches(/^\d+$/, '숫자만 가능').length(4, '최대 4글자'),
  memo: yup.string(),
});
