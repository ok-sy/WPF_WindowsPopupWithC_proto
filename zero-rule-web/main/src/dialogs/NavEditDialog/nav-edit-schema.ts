import * as yup from 'yup';
import '@local/validators';

export interface NavEdit {
  navNm: string;
  expl?: string | null;
}

/**
 * form validation schema for login
 */
export const navEditSchema: yup.SchemaOf<NavEdit> = yup.object({
  navNm: yup.string().required('이름을 입력해주세요').max(40),
  expl: yup.string().max(500),
});
