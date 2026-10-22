import { createRoot } from 'react-dom/client';
import PopupQuestionTemplatePicker from '../zero-rule-web/main/src/features/RgstPop/PopupQuestionTemplatePicker';
// POL-06-01 : 문항·서식
// ■ 문항 템플릿 선택이 팝업 유형 전환(SURVEY↔QUIZ) 때 실제로 비워지는지 확인하는 하네스.
const root = createRoot(document.getElementById('root')!);
(window as any).loaded = [];
(window as any).renderPicker = (popupType: string) => root.render(
  <PopupQuestionTemplatePicker popupType={popupType as any} disabled={false} onBusy={() => {}}
    onChange={(_questions, templateId) => (window as any).loaded.push(templateId)} />);
(window as any).renderPicker('SURVEY');
