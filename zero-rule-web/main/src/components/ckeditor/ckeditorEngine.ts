/*
 * CKEditor 5 공통 엔진(`ckeditor5` 49 단일 패키지). 관리자 웹의 모든 CKEditor는 이 모듈로만 엔진·플러그인을 가져온다.
 * - 사용처: CommonCKEditor(BbsCKEditor가 감쌈) → commonEditorConfig, 팝업 PopupRichTextEditor → popupRichEditorConfig.
 *   두 화면은 같은 DecoupledEditor 클래스와 같은 패키지의 플러그인을 쓰고, 화면별 차이는 config(plugins·toolbar)로만 둔다.
 * - 다른 출처(개별 `@ckeditor/ckeditor5-*` 패키지, 별도 빌드 등)의 엔진을 한 탭에서 한 번 더 불러오면 화면을 오가는 순간
 *   `ckeditor-duplicated-modules` 오류가 난다. 새 에디터·플러그인도 반드시 `ckeditor5`에서 이 파일을 통해 가져온다.
 * - 브라우저 전용 모듈이라 컴포넌트에서 정적 import하지 않는다. `loadCkeditorEngine()`(dynamic import)으로만 불러와
 *   SSR에서 제외하고, 에디터가 있는 화면에서만 엔진 청크·CSS를 내려받게 한다.
 * - 라이선스: GPL-2.0-or-later로 사용한다(licenseKey 'GPL'). 'GPL' 키는 npm 설치본에서만 동작하고(CDN이면 막힘),
 *   편집 영역에 'Powered by CKEditor' 표시가 항상 나온다. 47.x LTS 라인은 'GPL' 키를 막으므로 올리지 않는다.
 */
import {
  Alignment,
  Autoformat,
  Base64UploadAdapter,
  BlockQuote,
  Bold,
  Code,
  CodeBlock,
  DecoupledEditor,
  Essentials,
  FindAndReplace,
  FontBackgroundColor,
  FontColor,
  FontFamily,
  FontSize,
  Heading,
  Highlight,
  HorizontalLine,
  Image,
  ImageCaption,
  ImageInsert,
  ImageResize,
  ImageStyle,
  ImageToolbar,
  ImageUpload,
  Indent,
  IndentBlock,
  Italic,
  Link,
  LinkImage,
  List,
  ListProperties,
  MediaEmbed,
  PageBreak,
  Paragraph,
  PasteFromOffice,
  RemoveFormat,
  SourceEditing,
  SpecialCharacters,
  SpecialCharactersEssentials,
  Strikethrough,
  Subscript,
  Superscript,
  Table,
  TableCellProperties,
  TableProperties,
  TableToolbar,
  TextTransformation,
  TodoList,
  Underline,
  type EditorConfig,
} from 'ckeditor5';
import koTranslations from 'ckeditor5/translations/ko.js';
import 'ckeditor5/ckeditor5.css';

export { DecoupledEditor };

/** 모든 에디터 공통: 라이선스·한국어 UI(이전 커스텀 빌드의 language: 'ko'와 내장 한국어 번역을 대체). */
const BASE_CONFIG: EditorConfig = {
  licenseKey: 'GPL',
  language: 'ko',
  translations: [koTranslations],
};

/**
 * 게시판·자료실 등 공용 에디터(CommonCKEditor). 이전 커스텀 빌드(@cp949/ckeditor5-custom-build 0.0.15)의
 * builtinPlugins·defaultConfig를 그대로 옮기고 아래만 바로잡았다.
 * - LinkImage 추가: 이미지 툴바의 'linkImage' 버튼에 필요한 플러그인이 빠져 있어 toolbarview-item-unavailable 경고가 났다.
 * - MediaEmbedToolbar 제외: 툴바 항목 설정 없이 등록돼 widget-toolbar-no-items 경고만 내고 표시할 버튼이 없었다.
 * - 특수문자: SpecialCharactersEssentials가 화살표·통화·라틴·수학·텍스트 묶음을 모두 포함하므로 개별 묶음은 생략.
 */
export const commonEditorConfig: EditorConfig = {
  ...BASE_CONFIG,
  plugins: [
    Alignment,
    Autoformat,
    Base64UploadAdapter,
    BlockQuote,
    Bold,
    Code,
    CodeBlock,
    Essentials,
    FindAndReplace,
    FontBackgroundColor,
    FontColor,
    FontFamily,
    FontSize,
    Heading,
    Highlight,
    HorizontalLine,
    Image,
    ImageCaption,
    ImageInsert,
    ImageResize,
    ImageStyle,
    ImageToolbar,
    ImageUpload,
    Indent,
    IndentBlock,
    Italic,
    Link,
    LinkImage,
    List,
    ListProperties,
    MediaEmbed,
    PageBreak,
    Paragraph,
    PasteFromOffice,
    RemoveFormat,
    SourceEditing,
    SpecialCharacters,
    SpecialCharactersEssentials,
    Strikethrough,
    Subscript,
    Superscript,
    Table,
    TableCellProperties,
    TableProperties,
    TableToolbar,
    TextTransformation,
    TodoList,
    Underline,
  ],
  toolbar: {
    items: [
      'heading',
      '|',
      'alignment',
      'bold',
      'highlight',
      'fontSize',
      'insertTable',
      'insertImage',
      'link',
      'blockQuote',
      '|',
      'numberedList',
      'bulletedList',
      'todoList',
      '|',
      'outdent',
      'indent',
      '|',
      'codeBlock',
      'code',
      '|',
      'fontColor',
      'fontBackgroundColor',
      '|',
      'mediaEmbed',
      'underline',
      'italic',
      'strikethrough',
      '|',
      'subscript',
      'superscript',
      'specialCharacters',
      '|',
      'removeFormat',
      'horizontalLine',
      'findAndReplace',
      '|',
      'sourceEditing',
      'pageBreak',
      'undo',
      'redo',
    ],
  },
  image: {
    toolbar: ['imageTextAlternative', 'imageStyle:inline', 'imageStyle:block', 'imageStyle:side', 'linkImage'],
  },
  table: {
    contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells', 'tableCellProperties', 'tableProperties'],
  },
};

/**
 * 팝업 서식 편집기(PopupRichTextEditor). 서식 본문 계약(문단 정렬·들여쓰기, 굵게·기울임·밑줄·취소선·색·크기·글꼴)에
 * 필요한 플러그인만 둔다. 계약 밖 서식(표·목록·이미지·링크 등)은 저장 시 htmlToBlocks가 버리므로 편집기에서도 만들지 않는다.
 * 툴바·허용 값은 popupRichText.richEditorConfig에서 정한다. 실행 취소·붙여넣기·입력은 Essentials가 제공한다.
 */
export const popupRichEditorConfig: EditorConfig = {
  ...BASE_CONFIG,
  plugins: [
    Essentials,
    Paragraph,
    PasteFromOffice,
    Bold,
    Italic,
    Underline,
    Strikethrough,
    FontColor,
    FontSize,
    FontFamily,
    Alignment,
    Indent,
    IndentBlock,
  ],
};
