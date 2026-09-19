import * as yup from 'yup';
import '@local/validators';

export interface PwdForm {
  oldPwd: string;
  newPwd: string;
  pwdCheck: string;
}

/**
 * form validation schema for login
 */
const pwdExp = /^.*(?=^.{8,20}$)(?=.*\d)(?=.*[a-zA-Z])(?=.*[!@#$%^&+=]).*$/;
export const pwdSchema: yup.SchemaOf<PwdForm> = yup.object({
  oldPwd: yup
    .string()
    .required('기존 비밀번호를 입력해주세요')
    .noWhitespace('공백을 포함할수 없습니다.'),
  newPwd: yup
    .string()
    .required('새 비밀번호를 입력해주세요')
    .noWhitespace('공백을 포함할 수 없습니다')
    .matches(pwdExp, '영문, 숫자, 특수문자가 포함된 8~20개의 자리수로 입력해주세요.'),
  pwdCheck: yup
    .string()
    .oneOf([yup.ref('newPwd'), null], '패스워드가 일치하지 않습니다.')
    .required('비밀번호 확인을 입력해주세요'),
});
