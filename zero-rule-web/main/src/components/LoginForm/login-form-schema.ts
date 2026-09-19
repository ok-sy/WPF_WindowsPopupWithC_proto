import * as yup from 'yup';
import '@local/validators';

interface LoginFormValues {
  lgonId: string;
  passwd: string;
}

/**
 * form validation schema for login
 */
export const loginFormSchema: yup.SchemaOf<LoginFormValues> = yup.object({
  lgonId: yup
    .string()
    .required('사용자ID를 입력해주세요')
    .noWhitespace('공백을 포함할 수 없습니다')
    .max(40),
  passwd: yup.string().required('비밀번호를 입력해주세요').max(40),
});
