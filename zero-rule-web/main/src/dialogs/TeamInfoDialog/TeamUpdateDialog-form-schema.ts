import * as yup from 'yup';

export interface teamUpdateDialogFormType {
  teamNm: string;
  teamExpl?: string;
}

/**
 * form validation schema for login
 */
export const teamUpdateDialogFormSchema: yup.SchemaOf<teamUpdateDialogFormType> = yup
  .object()
  .shape({
    // inputId: yup.string().min(1, '최소 1글자다').required('사용자ID를 입력해주세요'),
    teamNm: yup.string().required('팀 이름을 입력해주세요'),
    teamExpl: yup.string(),
  });
