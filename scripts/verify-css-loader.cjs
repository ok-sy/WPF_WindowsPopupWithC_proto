// 검증 하네스 전용: CSS 파일을 style 태그로 넣는 최소 로더(CKEditor 공통 엔진의 ckeditor5.css용).
module.exports = source => `const style = document.createElement('style');
style.textContent = ${JSON.stringify(source)};
document.head.appendChild(style);`;
