import * as yup from 'yup';
import '@local/validators';

export interface SectionInsert {
  sectionNm: string;
}

/**
 * form validation schema for login
 */
export const sectionInsertFormSchema: yup.SchemaOf<SectionInsert> = yup.object({
  sectionNm: yup.string().required('그룹 이름을 입력해주세요').max(40),
});
