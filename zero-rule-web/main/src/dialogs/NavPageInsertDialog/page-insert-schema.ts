import * as yup from 'yup';
import '@local/validators';

export interface PageInsert {
  pageNm: string;
  pageKey?: string;
  url: string;
  dtlExpl?: string | null;
}

/**
 * form validation schema for login
 */
export const pageInsertFormSchema: yup.SchemaOf<PageInsert> = yup.object({
  pageNm: yup.string().required('페이지 번호를 입력해주세요').max(40),
  pageKey: yup.string().noWhitespace('공백을 포함할 수 없습니다').max(10),
  url: yup
    .string()
    .required('URL을 입력해주세요')
    .noWhitespace('공백을 포함할 수 없습니다')
    .max(40),
  dtlExpl: yup.string().max(500).nullable(),
});
