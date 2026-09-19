import * as yup from 'yup';

/**
 * form validation schema for login
 */
export const userMgmtDialogFormSchema = yup.object().shape({
  // inputId: yup.string().min(1, '최소 1글자다').required('사용자ID를 입력해주세요'),
  id: yup.string().required('사용자ID를 입력해주세요'),
  teamName: yup.string().required('팀명을 입력해주세요'),
  teamExplanation: yup.string().required('전화번호를 입력해주세요'),
  teamWork: yup.string().required('업무를 입력해주세요'),
  teamCount: yup.string().required('팀원수를 입력해주세요'),
});

export interface userMgmtDialogFormValues {
  id: string;
  teamName: string;
  teamCount?: number;
  teamWork: string;
  teamExplanation?: string;
}
