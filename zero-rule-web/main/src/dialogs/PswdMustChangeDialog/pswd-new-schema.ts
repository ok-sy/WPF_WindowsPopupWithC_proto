import * as yup from 'yup';
export type NewPswd = {
  pswd: string;
};
/**
 * form validation schema for login
 */
export const newPswdSchema: yup.SchemaOf<NewPswd> = yup.object().shape({
  pswd: yup.string().required('변경할 비밀번호를 입력해주세요.'),
});
