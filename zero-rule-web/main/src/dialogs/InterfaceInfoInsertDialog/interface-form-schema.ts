import * as yup from 'yup';

export const interfaceFormSchema: yup.SchemaOf<InputData> = yup.object().shape({
  ifNm: yup.string().required('사용자ID를 입력해주세요').noWhitespace('공백을 포함할 수 없습니다'),
  ifDesc: yup.string().required('사용자ID를 입력해주세요'),
  docLength: yup.number().required('사용자ID를 입력해주세요'),
  characterset: yup.string().required('사용자ID를 입력해주세요'),
  eaiid: yup.string().required('사용자ID를 입력해주세요'),
});
export type InputData = {
  ifNm: string;
  ifDesc: string;
  docLength: number;
  characterset: string;
  eaiid: string;
};
