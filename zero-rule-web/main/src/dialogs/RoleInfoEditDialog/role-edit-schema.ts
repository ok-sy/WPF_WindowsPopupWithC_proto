import * as yup from 'yup';
import '@local/validators';

export interface RoleEditForm {
  roleId: string;
  roleNm: string;
  dtlExpl?: string;
}

/**
 * form validation schema for login
 */
export const roleFormSchema: yup.SchemaOf<RoleEditForm> = yup.object({
  roleId: yup
    .string()
    .noWhitespace('공백을 포함할 수 없습니다')
    .max(10)
    .required('ID는 필수입니다.'),
  roleNm: yup
    .string()
    .noWhitespace('공백을 포함할 수 없습니다')
    .max(200)
    .required('이름은 필수입니다.'),
  dtlExpl: yup.string().max(500),
});
