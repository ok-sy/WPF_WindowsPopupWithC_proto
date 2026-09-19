import * as yup from 'yup';
import '@local/validators';

export interface CodeTypeAddType {
  codeType: string; // pk1
  codeTypeNm: string;
  dtlExpl?: string;
}

/**
 * form validation schema for login
 */
export const commonCodeTypeAddSchema: yup.SchemaOf<CodeTypeAddType> = yup.object({
  codeType: yup
    .string()
    .required('코드 타입을 입력해주세요')
    .noWhitespace('공백을 포함할 수 없습니다')
    .max(40),
  codeTypeNm: yup
    .string()
    .required('코드 이름을 입력해주세요')
    .noWhitespace('공백을 포함할 수 없습니다')
    .max(40),
  dtlExpl: yup.string().max(2000),
});
