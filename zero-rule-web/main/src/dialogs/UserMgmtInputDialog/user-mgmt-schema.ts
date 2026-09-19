import { CLUserStateKey } from '@local/domain';
import * as yup from 'yup';

/**
 * form validation schema for login
 */
export const userMgmtDialogFormSchema = yup.object().shape({
  lgonId: yup.string().required('로그인ID를 입력해주세요'),
  userName: yup.string().required('이름을 입력해주세요'),
  bryyMndy: yup
    .string()
    .matches(
      /^([0-9][0-9]|20\d{2})(0[0-9]|1[0-2])(0[1-9]|[1-2][0-9]|3[0-1])$/,
      '6글자 형식으로 입력해주세요. ex) 960315',
    ),
  userTno2: yup.string().matches(/^\d+$/, '숫자만').length(4, '4글자'),
  userTno3: yup.string().length(4, '4글자'),
  userExno2: yup.string().matches(/^\d+$/, '숫자').length(3, '3글자'),
  userExno3: yup.string().matches(/^\d+$/, '숫자').length(4, '4글자'),
  memo: yup.string(),
});

export type UserMgmtDialogDataType = {
  lgonId: string; // 로그인 아이디
  userName: string; // 사용자 이름
  bryyMndy: string; // 생년월일
  userTno1: string; // 전화번호
  userTno2: string; // 전화번호
  userTno3: string; // 전화번호
  userExno1: string; // 내선번호
  userExno2: string; // 내선번호
  userExno3: string; // 내선번호
  memo?: string; // 메모
};
