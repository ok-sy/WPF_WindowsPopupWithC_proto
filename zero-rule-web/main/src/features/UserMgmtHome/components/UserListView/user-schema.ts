import * as yup from 'yup';

export type UserDataType = {
  id: string;
  password: string;
  name: string;
  team: string;
  tell: string;
  memo: string;
  security: string;
  downloadAccess: boolean;
};

/**
 * form validation schema for meta change
 */
export const userChangeSchema = yup.object().shape({
  id: yup.string().required('id를 입력해주세요'),
  password: yup.string().required('비밀번호를 입력해주세요'),
  name: yup.string().required('이름을 입력해주세요'),
  team: yup.string().required('팀을 선택해주세요'),
  tell: yup.string().required('전화번호를 입력해주세요'),
  memo: yup.string().required('메모를 입력해주세요'),
  security: yup.string().required('보안등급을 선택해주세요'),
  downloadAccess: yup.string().required('다운로드 권한 을 선택해주세요'),
});
