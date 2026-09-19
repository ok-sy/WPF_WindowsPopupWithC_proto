import * as yup from 'yup';
import '@local/validators';

export type SignUpFormDataType = {
  lgonId: string;
  userNm: string;
  passwd: string;
  passwdRepeat: string;
  // userEmail?: string
};

/**
 * form validation schema for signUp
 */
export const signUpFormSchema: yup.SchemaOf<SignUpFormDataType> = yup.object({
  lgonId: yup
    .string()
    .required('사용자ID를 입력해주세요')
    .noWhitespace('공백을 포함할 수 없습니다')
    .max(20, '최대 20글자로 입력해주세요')
    .matches(/^[a-z]/, '소문자 알파벳으로 시작해주세요'),
  userNm: yup.string().required('이름을 입력해주세요').max(30, '최대 30글자로 입력해주세요'),
  passwd: yup
    .string()
    .required('비밀번호를 입력해주세요')
    .noWhitespace('공백을 포함할 수 없습니다')
    .min(4, '4 ~ 40글자 길이로 입력해주세요')
    .max(40, '4 ~ 40글자 길이로 입력해주세요'),
  passwdRepeat: yup
    .string()
    .label('비밀번호 확인')
    .required('비밀번호를 확인해주세요')
    .max(40)
    .oneOf([yup.ref('passwd'), null], '두 비밀번호가 일치하지 않습니다.'),
  // userEmail: yup.string().required('이메일을 입력해주세요'),
});
