import * as yup from 'yup';
import '@local/validators';

/**
 * form validation schema
 */
export const CommonCodeTypeFormSchema: yup.SchemaOf<CommonCodeTypeFormValues> = yup.object({
  codeType: yup
    .string()
    .required('그룹 코드를 입력해주세요')
    .noWhitespace('공백을 포함할 수 없습니다')
    .max(40),
  codeTypeNm: yup.string().required('그룹명을 입력해주세요').max(40),
  dtlExpl: yup.string().max(2000),
});

export interface CommonCodeTypeFormValues {
  codeType: string; // pk1
  codeTypeNm: string;
  dtlExpl?: string;
}
