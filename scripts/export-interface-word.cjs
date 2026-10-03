// Word 전용 표·탐색·인쇄 레이아웃. Node 표준 라이브러리만 사용.
const fs = require('node:fs'), path = require('node:path'), zlib = require('node:zlib');
const root = path.resolve(__dirname, '..');
const output = path.resolve(process.argv[2] || path.join(root, 'docs/interfaces/WPF_Popup_API_Interface_v3.5.docx'));
const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
let body = '', bookmark = 0;
const headings = [];
function run(text, props = '') {
  return `<w:r>${props ? `<w:rPr>${props}</w:rPr>` : ''}${String(text).split('\n').map((t,i) => (i?'<w:br/>':'') + `<w:t xml:space="preserve">${esc(t)}</w:t>`).join('')}</w:r>`;
}
function inline(text) {
  return text.split(/(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g).map(s => {
    if (s.startsWith('`')) return run(s.slice(1, -1), '<w:rStyle w:val="InlineCode"/>');
    if (s.startsWith('**')) return inline(s.slice(2, -2)).replace(/<w:r>(<w:rPr>)?/g, (_, props) => props ? '<w:r><w:rPr><w:b/>' : '<w:r><w:rPr><w:b/></w:rPr>');
    const link = s.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) return run(link[1], '<w:b/>') + run(` (${link[2]})`, '<w:color w:val="51627A"/><w:sz w:val="18"/>');
    return run(s);
  }).join('');
}
function p(text, style = 'Normal', props = '', raw = false) {
  return `<w:p><w:pPr><w:pStyle w:val="${style}"/>${props}</w:pPr>${raw ? text : inline(text)}</w:p>`;
}
function heading(text, level = 1, page = false) {
  const id = ++bookmark, name = `section_${id}`;
  headings.push({text, level, name});
  body += p(`<w:bookmarkStart w:id="${id}" w:name="${name}"/>${inline(text)}<w:bookmarkEnd w:id="${id}"/>`, `Heading${level}`, page ? '<w:pageBreakBefore/>' : '', true);
}
function cell(paragraphs, width, shade) {
  return `<w:tc><w:tcPr><w:tcW w:w="${width}" w:type="dxa"/><w:vAlign w:val="top"/>${shade ? `<w:shd w:fill="${shade}"/>` : ''}</w:tcPr>${paragraphs}</w:tc>`;
}
function table(headers, rows) {
  // 필드 표를 세 열로 재편해 긴 설명·기본값이 좁은 열에 갇히지 않도록 한다.
  const fields = headers.length === 5 && headers[1] === '형식';
  const minimal = headers.length === 5 && headers.some(h => /Default/.test(h)) && !fields;
  let widths;
  if (fields || minimal) {
    widths = [2650, 2200, 4936];
    headers = fields ? ['필드 / 형식', '필수 여부 / 기본값', headers[4]] : [headers[0], '지원 / 필수 / 기본값', headers[4]];
    rows = rows.map(r => fields
      ? [p(r[0], 'FieldName') + p(r[1], 'CellMuted'), p(`**필수**  ${r[2]}`, 'Cell') + p(`**기본값**  ${r[3]}`, 'Cell'), p(r[4], 'Cell')]
      : [p(r[0], 'FieldName'), p(`**${r[1]}**`, 'Cell') + p(`**필수**  ${r[2]}`, 'Cell') + p(`**기본값**  ${r[3]}`, 'Cell'), p(r[4], 'Cell')]);
  } else {
    widths = headers.length === 2 ? [2850, 6936] : headers.length === 3 ? [2450, 2450, 4886] : headers.length === 4 ? [1400, 3000, 1100, 4286] : headers.map(() => Math.floor(9786 / headers.length));
    if (headers.includes('경로')) widths = [1100, 5186, 3500];
    rows = rows.map(r => r.map((s, i) => p(s, i === 0 ? 'FieldName' : 'Cell')));
  }
  body += '<w:tbl><w:tblPr><w:tblW w:w="9786" w:type="dxa"/><w:tblLayout w:type="fixed"/><w:tblBorders><w:bottom w:val="single" w:sz="6" w:color="CDD7E2"/><w:insideH w:val="single" w:sz="4" w:color="DEE5ED"/></w:tblBorders><w:tblCellMar><w:top w:w="110" w:type="dxa"/><w:left w:w="120" w:type="dxa"/><w:bottom w:w="110" w:type="dxa"/><w:right w:w="120" w:type="dxa"/></w:tblCellMar></w:tblPr>';
  body += '<w:tblGrid>' + widths.map(w => `<w:gridCol w:w="${w}"/>`).join('') + '</w:tblGrid>';
  body += '<w:tr><w:trPr><w:tblHeader/><w:cantSplit/></w:trPr>' + headers.map((h, i) => cell(p(h, 'TableHead'), widths[i], '17365A')).join('') + '</w:tr>';
  rows.forEach((r, n) => { body += '<w:tr><w:trPr><w:cantSplit/></w:trPr>' + r.map((s, i) => cell(s, widths[i], n % 2 === 0 ? 'F1F5FA' : 'FFFFFF')).join('') + '</w:tr>'; });
  body += '</w:tbl>' + p('', 'TableAfter');
}
function codeBlock(lines, language) {
  body += p(language === 'json' ? 'JSON 예제' : language === 'http' ? 'HTTP 요청' : '처리 흐름 / 참고', 'CodeLabel');
  lines.forEach((line, i) => {
    const spans = line.split(/("(?:[^"\\]|\\.)*"|\btrue\b|\bfalse\b|\bnull\b)/g);
    const text = spans.map(s => run(s, s.startsWith('"') ? '<w:color w:val="155A79"/>' : /^(true|false|null)$/.test(s) ? '<w:color w:val="905330"/>' : '')).join('');
    body += p(text, 'Code', i < lines.length - 1 && lines.length <= 18 ? '<w:keepNext/>' : '', true);
  });
  body += p('', 'TableAfter');
}
function markdown(source, appendix = false) {
  const lines = source.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim() || /^---+$/.test(line)) continue;
    if (line.startsWith('```')) {
      const block = [], language = line.slice(3).trim();
      while (++i < lines.length && !lines[i].startsWith('```')) block.push(lines[i]);
      if (i === lines.length) throw new Error('Unclosed code fence');
      codeBlock(block, language); continue;
    }
    if (line.startsWith('|')) {
      const split = s => s.trim().slice(1, -1).split(/(?<!\\)\|/).map(v => v.trim().replace(/\\\|/g, '|'));
      const headers = split(line), rows = [];
      while (i + 1 < lines.length && lines[i + 1].startsWith('|')) {
        const next = lines[++i];
        if (!/^\|[\s:|\-]+\|$/.test(next)) rows.push(split(next));
      }
      if (rows.some(r => r.length !== headers.length)) throw new Error(`Uneven table: ${headers}`);
      table(headers, rows); continue;
    }
    const h = line.match(/^(#{1,6})\s+(.+)$/);
    if (h) {
      if (!/^\d+[.]/.test(h[2]) && h[1].length === 1) continue;
      const top = /^\d+\.\s/.test(h[2]), sub = /^\d+\.\d+/.test(h[2]);
      let level = top ? 1 : sub ? 2 : 3;
      if (appendix) level = top ? 2 : 3;
      const text = appendix ? h[2].replace(/^(\d+(?:\.\d+)*)(\.?)/, 'B.$1$2') : h[2];
      heading(text, level, !appendix && top && !/^(3|10|12|17)\.\s/.test(text));
      continue;
    }
    if (line.startsWith('>')) { const t = line.replace(/^>\s?/, ''); if (t) body += p(t, 'Callout'); continue; }
    if (/^- \[[ x]\]/.test(line)) body += p('□  ' + line.slice(6), 'List');
    else if (/^- /.test(line)) body += p('•  ' + line.slice(2), 'List');
    else body += p(line);
  }
}

body += p('INTERFACE SPECIFICATION', 'Kicker', '<w:spacing w:before="1100" w:after="420"/>');
body += p('WPF 팝업', 'CoverTitle');
body += p('API 인터페이스 정의서', 'CoverTitle');
body += p('백엔드 연동 · HTTP / JSON 계약', 'Subtitle');
body += p('VERSION 3.5   /   2026.10.03', 'CoverVersion', '<w:spacing w:before="500" w:after="640"/>');
body += p('로그인 → 표시 대상 조회 → 처리 결과 전송', 'CoverFlow');
body += p('TEXT   ·   IMAGE   ·   VIDEO   ·   SURVEY   ·   QUIZ', 'Subtitle');
body += p('이 문서를 읽는 순서', 'CoverGuide', '<w:spacing w:before="720" w:after="160"/>');
body += p('연동 시작    3장 API 목록 → 4장 인증 → 5·6·10장 요청/응답');
body += p('화면 데이터    6·7장 공통 필드 → 8장 유형별 content → 9장 문항');
body += p('오류와 검증    11~13장 결과 처리 → 16장 구현 체크리스트');
body += p('범위 확인    부록 A 관리자 연동 / 부록 B 최초 외부 제공 범위');
body += p('계약 기준: 2026-10-03 v3.5  |  문서 편집: 2026-10-03\n예제는 설명용 가상 데이터입니다.', 'CoverNote', '<w:spacing w:before="700"/>');
body += p('목차', 'TOCTitle', '<w:pageBreakBefore/>');
body += '<!--TOC-->';
heading('문서 안내', 1, true);
body += p('필드 표는 필드·형식, 필수 여부·기본값, 처리 설명 순서로 읽습니다. 부록 B의 최소 기능 범위는 본문의 전체 구현 계약과 구분합니다.');
const spec = fs.readFileSync(path.join(root, 'docs/interfaces/POPUP_INTERFACE_SPEC.md'), 'utf8');
markdown(spec);
heading('부록 A. 현 프로젝트 관리자 연동', 1, true);
body += p('아래 API는 zero-rule-server 컨텍스트 뒤에 붙는 관리자 경로입니다. 별도 백엔드에 요구하는 WPF 계약 범위에는 포함하지 않습니다.');
table(['Method', '경로', '기능'], [
  ['POST','`/apis/popup/list`','팝업 목록'], ['POST','`/apis/popup/info`','팝업 상세'],
  ['POST','`/apis/popup/save`','팝업 등록·수정'], ['POST','`/apis/popup/active`','활성 변경'],
  ['POST','`/apis/popup/question-templates`','문항 템플릿 목록'], ['POST','`/apis/popup/question-template`','문항 템플릿 상세']
]);
body += p('기존 WPF 조회·숨김·응답·이벤트 API는 제거되었습니다. 현재 로그인·목록·결과 API 3개를 사용합니다. 영상 스트리밍 `GET /p/api/popups/video`는 유지합니다.');
body += p('**IMAGE 기본값 구분**\n관리자 신규 등록은 ORIGINAL을 선택합니다. WPF 계약에서 imageSizeMode가 생략되면 ADAPTIVE를 사용합니다.', 'Callout');
body += p('동영상+퀴즈는 `QUIZ`와 `content.videoEnabled=true`로 저장합니다. 새 기능을 사용할 때 WPF와 서버를 함께 갱신합니다.');
body += p('SURVEY·QUIZ 미리보기는 세로형 전체 폭 Row·우측 체크 Path와 가로형 공통 Chip, 무채색 상태 및 스크롤 밖 고정 제출 영역을 사용합니다. 실제 컨트롤의 단일/복수 선택·필수 검증·응답 OPTION_ID 계약은 유지합니다.');
body += p('관리자 미리보기의 예제 문항은 WPF Demo와 동일한 가로/세로·단일/복수·짧은/긴 보기 사례입니다. 예제·응답·로컬 미리보기 점수는 편집 데이터나 서버 결과 API에 저장하지 않습니다. 상세 케이스·검증은 설계 21·22를 참조합니다.');
body += p('Content·Options 상세 가이드: `popup-frameWork/Popup/Docs/POPUP_OPTION_GUIDE.md`');
heading('부록 B. 최초 외부 제공 최소 기능 범위', 1, true);
body += p('이 부록은 최초 제공할 기능 범위입니다. 본문의 전체 구현 계약과 구분하여 읽으세요.', 'Callout');
markdown(fs.readFileSync(path.join(root, 'docs/interfaces/WPF_POPUP_MINIMAL_SPEC.md'), 'utf8'), true);

const toc = p('<w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText xml:space="preserve"> TOC \\o "1-2" \\h \\z \\u </w:instrText></w:r><w:r><w:fldChar w:fldCharType="separate"/></w:r>', 'Normal', '', true)
  + headings.filter(h => h.level <= 2).map(h => p(`<w:hyperlink w:anchor="${h.name}" w:history="1">${run(h.text)}</w:hyperlink>`, h.level === 1 ? 'TOC1' : 'TOC2', '', true)).join('')
  + p('<w:r><w:fldChar w:fldCharType="end"/></w:r>', 'Normal', '', true);
body = body.replace('<!--TOC-->', toc);
const style = (id, name, pp, rp, extra = '') => `<w:style w:type="paragraph" w:styleId="${id}"><w:name w:val="${name}"/><w:basedOn w:val="Normal"/>${extra}<w:pPr>${pp}</w:pPr><w:rPr>${rp}</w:rPr></w:style>`;
const sz = n => `<w:sz w:val="${n}"/><w:szCs w:val="${n}"/>`, color = s => `<w:color w:val="${s}"/>`;
let styles = `<w:styles xmlns:w="${W}"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="맑은 고딕"/>${sz(21)}${color('243449')}<w:lang w:val="en-US" w:eastAsia="ko-KR"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="130" w:line="300" w:lineRule="exact"/><w:widowControl/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>`;
for (let level = 1; level <= 3; level++) styles += style(`Heading${level}`, `heading ${level}`, `<w:keepNext/><w:keepLines/><w:spacing w:before="${level === 1 ? 240 : 280}" w:after="180" w:line="${level === 1 ? 480 : 360}" w:lineRule="exact"/><w:outlineLvl w:val="${level-1}"/>${level === 1 ? '<w:pBdr><w:bottom w:val="single" w:sz="14" w:space="12" w:color="24A0A8"/></w:pBdr>' : ''}`, '<w:b/>' + sz([0,36,27,23][level]) + color('17365A'), '<w:next w:val="Normal"/><w:qFormat/>');
styles += style('Cell', 'Table body', '<w:spacing w:after="30" w:line="240" w:lineRule="exact"/>', sz(19));
styles += style('FieldName', 'Field name', '<w:spacing w:after="30" w:line="240" w:lineRule="exact"/>', '<w:b/>' + sz(19) + color('17365A'));
styles += style('CellMuted', 'Field type', '<w:spacing w:after="30" w:line="240" w:lineRule="exact"/>', sz(17) + color('61728A'));
styles += style('TableHead', 'Table heading', '<w:keepNext/><w:spacing w:after="0"/>', '<w:b/>' + sz(19) + color('FFFFFF'));
styles += style('TableAfter', 'Table spacing', '<w:spacing w:after="70" w:line="70" w:lineRule="exact"/>', sz(4));
styles += style('Code', 'Code block', '<w:spacing w:after="0" w:line="230" w:lineRule="exact"/><w:ind w:left="180" w:right="180"/><w:shd w:fill="F0F3F7"/>', '<w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/>' + sz(18));
styles += style('CodeLabel', 'Example label', '<w:keepNext/><w:spacing w:before="180" w:after="80"/>', '<w:b/>' + sz(18) + color('61728A'));
styles += style('List', 'List paragraph', '<w:ind w:left="220" w:hanging="220"/><w:spacing w:after="90"/>', '');
styles += style('Callout', 'Important note', '<w:spacing w:before="140" w:after="180"/><w:ind w:left="180" w:right="180"/><w:shd w:fill="EAF3F6"/><w:pBdr><w:left w:val="single" w:sz="18" w:space="10" w:color="24A0A8"/></w:pBdr>', sz(20));
styles += style('Kicker', 'Cover kicker', '', '<w:b/>' + sz(20) + color('238B94'));
styles += style('CoverTitle', 'Cover title', '<w:spacing w:after="180" w:line="760" w:lineRule="exact"/>', '<w:b/>' + sz(58) + color('17365A'));
styles += style('CoverGuide', 'Cover guide', '', '<w:b/>' + sz(27) + color('17365A'));
styles += style('Subtitle', 'Subtitle', '<w:spacing w:after="160"/>', sz(24) + color('61728A'));
styles += style('CoverVersion', 'Cover version', '', '<w:b/>' + sz(24) + color('238B94'));
styles += style('CoverFlow', 'Cover process', '<w:spacing w:after="200"/>', '<w:b/>' + sz(25) + color('17365A'));
styles += style('CoverNote', 'Cover note', '', sz(18) + color('61728A'));
styles += style('TOCTitle', 'Contents title', '<w:spacing w:after="300"/>', '<w:b/>' + sz(36) + color('17365A'));
styles += style('TOC1', 'toc 1', '<w:spacing w:before="100" w:after="70"/>', '<w:b/>' + sz(21) + color('17365A'));
styles += style('TOC2', 'toc 2', '<w:ind w:left="280"/><w:spacing w:after="40"/>', sz(19));
styles += `<w:style w:type="character" w:styleId="InlineCode"><w:name w:val="Inline code"/><w:rPr><w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/>${color('155A79')}</w:rPr></w:style></w:styles>`;
const xml = s => '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' + s;
const field = name => `<w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText> ${name} </w:instrText></w:r><w:r><w:fldChar w:fldCharType="end"/></w:r>`;
const parts = {
  '[Content_Types].xml': xml('<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>' + [['document','document.main'],['styles','styles'],['settings','settings'],['header1','header'],['footer1','footer']].map(([n,t]) => `<Override PartName="/word/${n}.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.${t}+xml"/>`).join('') + '</Types>'),
  '_rels/.rels': xml(`<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${R}/officeDocument" Target="word/document.xml"/></Relationships>`),
  'word/_rels/document.xml.rels': xml(`<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${[['styles','styles'],['settings','settings'],['header1','header'],['footer1','footer']].map(([n,t])=>`<Relationship Id="${n}" Type="${R}/${t}" Target="${n}.xml"/>`).join('')}</Relationships>`),
  'word/document.xml': xml(`<w:document xmlns:w="${W}" xmlns:r="${R}"><w:body>${body}<w:sectPr><w:headerReference w:type="default" r:id="header1"/><w:footerReference w:type="default" r:id="footer1"/><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1050" w:right="1060" w:bottom="1050" w:left="1060" w:header="480" w:footer="480"/><w:titlePg/></w:sectPr></w:body></w:document>`),
  'word/styles.xml': xml(styles),
  'word/settings.xml': xml(`<w:settings xmlns:w="${W}"><w:zoom w:percent="100"/><w:defaultTabStop w:val="420"/><w:updateFields w:val="true"/><w:compat><w:compatSetting w:name="compatibilityMode" w:uri="http://schemas.microsoft.com/office/word" w:val="15"/></w:compat></w:settings>`),
  'word/header1.xml': xml(`<w:hdr xmlns:w="${W}">${p(run('WPF POPUP   /   API INTERFACE', '<w:b/>'+sz(16)+color('61728A')) + run('                                      v3.5  ·  2026.10.03', sz(16)+color('61728A')), 'Normal', '<w:pBdr><w:bottom w:val="single" w:sz="4" w:space="7" w:color="CDD7E2"/></w:pBdr>', true)}</w:hdr>`),
  'word/footer1.xml': xml(`<w:ftr xmlns:w="${W}">${p(run('WPF 팝업 API 인터페이스 정의서', sz(16)+color('61728A')) + run('                                      ') + field('PAGE') + run(' / ') + field('NUMPAGES'), 'Normal', '', true)}</w:ftr>`)
};
// DOCX용 ZIP writer (Deflate, CRC32, 중앙 디렉터리).
const crcTable = Array.from({length:256}, (_, n) => { for(let k=0;k<8;k++) n = (n&1) ? 0xEDB88320^(n>>>1) : n>>>1; return n>>>0; });
function crc32(buf) { let c=0xFFFFFFFF; for(const b of buf)c=crcTable[(c^b)&255]^(c>>>8); return (c^0xFFFFFFFF)>>>0; }
let offset=0; const locals=[], centrals=[];
for(const [name, content] of Object.entries(parts)) {
  const n=Buffer.from(name), data=Buffer.from(content), packed=zlib.deflateRawSync(data), crc=crc32(data);
  const h=Buffer.alloc(30); h.writeUInt32LE(0x04034b50); h.writeUInt16LE(20,4); h.writeUInt16LE(0x800,6); h.writeUInt16LE(8,8); h.writeUInt32LE(crc,14); h.writeUInt32LE(packed.length,18); h.writeUInt32LE(data.length,22); h.writeUInt16LE(n.length,26);
  locals.push(h,n,packed);
  const c=Buffer.alloc(46); c.writeUInt32LE(0x02014b50); c.writeUInt16LE(20,4); c.writeUInt16LE(20,6); c.writeUInt16LE(0x800,8); c.writeUInt16LE(8,10); c.writeUInt32LE(crc,16); c.writeUInt32LE(packed.length,20); c.writeUInt32LE(data.length,24); c.writeUInt16LE(n.length,28); c.writeUInt32LE(offset,42); centrals.push(c,n); offset+=h.length+n.length+packed.length;
}
const central=Buffer.concat(centrals), end=Buffer.alloc(22); end.writeUInt32LE(0x06054b50); end.writeUInt16LE(Object.keys(parts).length,8); end.writeUInt16LE(Object.keys(parts).length,10); end.writeUInt32LE(central.length,12); end.writeUInt32LE(offset,16);
fs.writeFileSync(output, Buffer.concat([...locals,central,end]));
console.log(`Updated ${output}; tables=${(body.match(/<w:tbl>/g)||[]).length}, headings=${headings.length}`);
