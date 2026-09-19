import * as yup from 'yup';
import '@local/validators';

export interface ItemInsertForm {
  itemNm: string;
  itemAliasNm: string;
  itemExplanDesc: string;
}

/**
 * form validation schema for login
 */
export const insertFormSchema: yup.SchemaOf<ItemInsertForm> = yup.object({
  itemNm: yup.string().required('항목 이름을 입력해주세요').max(40),
  itemAliasNm: yup.string().required('별칭을 입력해 주세요').max(40),
  itemExplanDesc: yup.string().required('설명을 입력해 주세요').max(150),
});
