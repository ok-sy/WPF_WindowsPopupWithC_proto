import * as yup from 'yup';
import '@local/validators';

export interface PrivEditForm {
  privNm: string;
  dtlExpl?: string;
}

/**
 * form validation schema for login
 */
export const privFormSchema: yup.SchemaOf<PrivEditForm> = yup.object({
  privNm: yup
    .string()
    .noWhitespace('공백을 포함할 수 없습니다')
    .max(200)
    .required('이름은 필수입니다.'),
  dtlExpl: yup.string().max(500),
});
