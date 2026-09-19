import * as yup from 'yup';

/**
 * form validation schema for login
 */
export const teamMgmtDialogFormSchema = yup.object().shape({
  // lgonId: yup.string().required('로그인ID를 입력해주세요'),
  // userName: yup.string().required('이름을 입력해주세요'),
  // bryyMndy: yup
  //   .string()
  //   .matches(
  //     /^([0-9][0-9]|20\d{2})(0[0-9]|1[0-2])(0[1-9]|[1-2][0-9]|3[0-1])$/,
  //     '6글자 형식으로 입력해주세요. ex) 960315',
  //   ),
  // userTno2: yup.string().matches(/^\d+$/, '숫자만').length(4, '4글자'),
  // userTno3: yup.string().length(4, '4글자'),
  // userExno2: yup.string().matches(/^\d+$/, '숫자').length(3, '3글자'),
  // userExno3: yup.string().matches(/^\d+$/, '숫자').length(4, '4글자'),
  // memo: yup.string(),
  teamNm: yup.string().required('팀 이름을 입력해주세요'),
  teamExpl: yup.string(),
  teamCmmnStupCn: yup.string(),
  teamStat: yup.string(),
});

export type TeamMgmtDialogDataType = {
  teamNm: string;
  teamExpl?: string;
  teamCmmnStupCn?: string;
};
