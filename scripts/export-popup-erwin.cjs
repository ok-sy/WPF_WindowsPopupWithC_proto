// Node.js 18+, no dependencies. This is an ERwin XML interchange draft, not a
// substitute for validation against the installed ERwin version's XML schemas.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const input = path.join(root, 'db/oracle/01_popup_schema_oracle.sql');
const out = path.join(root, 'ERD/model');
const source = fs.readFileSync(input, 'utf8');
// This DDL uses -- comments only; quoted SQL strings may contain '--'.
function stripComments(text) {
  return text.replace(/'(?:''|[^'])*'|--[^\r\n]*/g, s => s.startsWith('--') ? '' : s);
}
function splitSql(text, delimiter) {
  let depth = 0, quoted = false, start = 0;
  const result = [];
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "'") {
      if (quoted && text[i + 1] === "'") { i++; continue; }
      quoted = !quoted;
    }
    if (quoted) continue;
    if (text[i] === '(') depth++;
    if (text[i] === ')') depth--;
    if (text[i] === delimiter && depth === 0) {
      result.push(text.slice(start, i).trim()); start = i + 1;
    }
  }
  assert.equal(depth, 0, 'Unbalanced SQL parentheses');
  assert.equal(quoted, false, 'Unclosed SQL string');
  if (text.slice(start).trim()) result.push(text.slice(start).trim());
  return result;
}
const tableNames = {
  APP_DEPARTMENT: '부서', APP_POSITION: '직급', APP_USER: '사용자',
  QUESTION_TEMPLATE: '문항 템플릿', POPUP_NOTICE: '팝업 공지', POPUP_CONTENT: '팝업 콘텐츠',
  POPUP_TARGET_GROUP: '팝업 대상 그룹', POPUP_TARGET_CONDITION: '팝업 대상 조건',
  POPUP_QUESTION: '팝업 문항', POPUP_OPTION: '팝업 선택지', USER_POPUP_STATUS: '사용자 팝업 상태',
  POPUP_RESPONSE: '팝업 응답', POPUP_RESPONSE_ANSWER: '문항 답안', POPUP_RESPONSE_VALUE: '선택 답안 값',
  VIDEO_VIEW_STATUS: '영상 시청 상태', API_REQUEST_LOG: 'API 요청 로그', WPF_RESULT_RECEIPT: 'WPF 결과 수신 영수증',
};
const labels = {
  DEPARTMENT_ID:'부서 ID',PARENT_DEPARTMENT_ID:'상위 부서 ID',DEPARTMENT_NAME:'부서명',DEPARTMENT_LEVEL:'부서 단계',
  SORT_ORDER:'정렬 순서',ACTIVE_YN:'활성 여부',CREATED_BY:'등록자',CREATED_AT:'등록 시각',UPDATED_BY:'수정자',UPDATED_AT:'수정 시각',
  POSITION_ID:'직급 ID',POSITION_NAME:'직급명',EMPLOYEE_NO:'사번',EMPLOYEE_NAME:'직원명',HIRE_DATE:'입사일',LAST_LOGIN_AT:'최종 로그인 시각',
  QUESTION_TEMPLATE_ID:'문항 템플릿 ID',TEMPLATE_GROUP_ID:'템플릿 그룹 ID',TEMPLATE_NAME:'템플릿명',TEMPLATE_TYPE:'템플릿 유형',TEMPLATE_VERSION:'템플릿 버전',CURRENT_YN:'현재 버전 여부',
  POPUP_ID:'팝업 ID',POPUP_TYPE:'팝업 유형',TITLE:'제목',SHOW_ON_LOGIN_YN:'로그인 시 표시 여부',SHOW_ON_SCHEDULE_YN:'예약 표시 여부',SCHEDULED_AT:'예약 시각',
  DISPLAY_START_AT:'표시 시작 시각',DISPLAY_END_AT:'표시 종료 시각',DISPLAY_MODE:'표시 방식',DISPLAY_ORDER:'표시 순서',PERIOD_MODE:'기간 방식',
  REPEAT_INTERVAL:'반복 간격',REPEAT_DAY_OF_WEEK:'반복 요일',REPEAT_DAY_OF_MONTH:'반복 일자',SIZE_MODE:'크기 방식',POPUP_WIDTH:'팝업 너비',POPUP_HEIGHT:'팝업 높이',
  WIDTH_RATIO:'너비 비율',HEIGHT_RATIO:'높이 비율',MINIMUM_WIDTH:'최소 너비',MINIMUM_HEIGHT:'최소 높이',MAXIMUM_WIDTH:'최대 너비',MAXIMUM_HEIGHT:'최대 높이',
  SHOW_HEADER_YN:'머리글 표시 여부',SHOW_CLOSE_BUTTON_YN:'닫기 버튼 표시 여부',SHOW_FOOTER_YN:'바닥글 표시 여부',SHOW_DO_NOT_SHOW_AGAIN_YN:'다시 보지 않기 표시 여부',
  HIDE_DAYS:'숨김 일수',COMPLETION_RATIO:'완료 기준 비율',PASSING_SCORE:'통과 점수',ALLOW_CLOSE_BEFORE_COMPLETE_YN:'완료 전 닫기 허용 여부',
  CONTENT_TITLE:'콘텐츠 제목',DESCRIPTION:'설명',CONTENT_BODY:'콘텐츠 본문',MEDIA_URL:'미디어 URL',LINK_URL:'연결 URL',CONTENT_OPTIONS:'콘텐츠 옵션 JSON',
  TARGET_GROUP_ID:'대상 그룹 ID',TARGET_NAME:'대상명',TARGET_DESCRIPTION:'대상 설명',GROUP_ORDER:'그룹 순서',TARGET_CONDITION_ID:'대상 조건 ID',
  CONDITION_TYPE:'조건 유형',CONDITION_OPERATOR:'조건 연산자',CONDITION_DATE_VALUE:'조건 날짜',INCLUDE_CHILD_YN:'하위 부서 포함 여부',CONDITION_ORDER:'조건 순서',
  QUESTION_ID:'문항 ID',QUESTION_TYPE:'문항 유형',QUESTION_TITLE:'문항 제목',QUESTION_DESCRIPTION:'문항 설명',REQUIRED_YN:'필수 여부',SCORED_YN:'채점 여부',
  QUESTION_SCORE:'문항 배점',CORRECT_ANSWER:'정답',ANSWER_MATCH_MODE:'정답 일치 방식',OPTION_ID:'선택지 ID',OPTION_VALUE:'선택지 값',OPTION_TEXT:'선택지 내용',CORRECT_YN:'정답 여부',
  USER_POPUP_STATUS_ID:'사용자 팝업 상태 ID',POPUP_STATUS:'팝업 상태',FIRST_DISPLAYED_AT:'최초 표시 시각',LAST_DISPLAYED_AT:'최종 표시 시각',DISPLAY_COUNT:'표시 횟수',
  CLOSED_AT:'닫은 시각',HIDDEN_FROM_AT:'숨김 시작 시각',HIDDEN_UNTIL_AT:'숨김 종료 시각',COMPLETED_YN:'완료 여부',COMPLETED_AT:'완료 시각',
  RESPONSE_ID:'응답 ID',CLIENT_REQUEST_ID:'클라이언트 요청 ID',RESPONSE_STATUS:'응답 상태',RESPONSE_STARTED_AT:'응답 시작 시각',SUBMITTED_AT:'제출 시각',RECEIVED_AT:'수신 시각',TOTAL_SCORE:'총점',PASSED_YN:'통과 여부',
  RESPONSE_ANSWER_ID:'문항 답안 ID',TEXT_ANSWER:'서술형 답안',EARNED_SCORE:'획득 점수',RESPONSE_VALUE_ID:'선택 답안 값 ID',SELECTED_VALUE:'선택 값',
  VIDEO_VIEW_STATUS_ID:'영상 시청 상태 ID',TOTAL_DURATION_SECONDS:'전체 영상 길이 초',LAST_POSITION_SECONDS:'최종 재생 위치 초',MAXIMUM_POSITION_SECONDS:'최대 재생 위치 초',
  WATCHED_SECONDS:'시청 시간 초',WATCHED_RATIO:'시청 비율',FIRST_PLAYED_AT:'최초 재생 기록 시각',LAST_PLAYED_AT:'최종 재생 기록 시각',
  API_REQUEST_LOG_ID:'API 요청 로그 ID',API_PATH:'API 경로',HTTP_METHOD:'HTTP 메서드',CLIENT_IP:'클라이언트 IP',REQUEST_RECEIVED_AT:'요청 수신 시각',RESPONSE_COMPLETED_AT:'응답 완료 시각',
  ELAPSED_MILLISECONDS:'처리 시간 밀리초',HTTP_STATUS_CODE:'HTTP 상태 코드',SUCCESS_YN:'성공 여부',ERROR_CODE:'오류 코드',ERROR_MESSAGE:'오류 메시지',REQUEST_SUMMARY:'요청 요약',RESPONSE_SUMMARY:'응답 요약',
  RECEIPT_ID:'수신 영수증 ID',RESULT_ID:'결과 ID',RESULT_TYPE:'결과 유형',RESULT_STATUS:'결과 상태',RESULT_CODE:'결과 코드',
};
const statements = splitSql(stripComments(source), ';');
const tables = [], comments = new Map();
for (const sql of statements) {
  const comment = sql.match(/^COMMENT ON (TABLE|COLUMN)\s+(\w+(?:\.\w+)?)\s+IS\s+'((?:''|[^'])*)'$/s);
  if (comment) { comments.set(comment[2], comment[3].replace(/''/g, "'")); continue; }
  const match = sql.match(/^CREATE TABLE (\w+)\s*\(([\s\S]*)\)$/);
  if (!match) continue;
  const table = {name: match[1], columns: [], keys: [], checks: [], sql};
  assert.ok(tableNames[table.name], `Missing table label: ${table.name}`);
  for (const part of splitSql(match[2], ',')) {
    const key = part.match(/^CONSTRAINT\s+(\w+)\s+(PRIMARY KEY|UNIQUE|FOREIGN KEY)\s*\(([^)]+)\)([\s\S]*)$/);
    if (key) {
      const entry = {name: key[1], type: key[2], columns: key[3].split(',').map(s => s.trim()), sql: part};
      if (entry.type === 'FOREIGN KEY') {
        const ref = key[4].match(/^\s*REFERENCES (\w+)\s*\(([^)]+)\)(?:\s+ON DELETE (CASCADE|SET NULL))?\s*$/);
        assert.ok(ref, `Unsupported FK: ${part}`);
        Object.assign(entry, {parent: ref[1], parentColumns: ref[2].split(',').map(s => s.trim()), deleteRule: ref[3] || 'NO ACTION'});
      }
      table.keys.push(entry); continue;
    }
    if (/^CONSTRAINT\s+\w+\s+CHECK\b/.test(part)) {table.checks.push(part); continue;}
    const col = part.match(/^(\w+)\s+((?:VARCHAR2|NUMBER|CHAR|TIMESTAMP|CLOB|DATE)(?:\([^)]*\))?)([\s\S]*)$/);
    assert.ok(col, `Unparsed column: ${part}`);
    assert.ok(labels[col[1]], `Missing column label: ${col[1]}`);
    const tail = col[3].trim();
    const defaultValue = tail.replace(/\s*NOT NULL\s*$/, '').match(/^DEFAULT\s+([\s\S]+)$/)?.[1] || null;
    assert.ok(!tail || tail === 'NOT NULL' || defaultValue, `Unparsed column suffix: ${tail}`);
    table.columns.push({name: col[1], type: col[2], notNull: /\bNOT NULL\b/.test(tail), defaultValue});
  }
  tables.push(table);
}
assert.equal(tables.length, 17, 'Unexpected table count; review DDL changes');
const byName = new Map(tables.map(t => [t.name, t]));
for (const t of tables) {
  assert.equal(t.keys.filter(k => k.type === 'PRIMARY KEY').length, 1);
  for (const key of t.keys) {
    key.columns.forEach(c => assert.ok(t.columns.some(x => x.name === c), `${t.name}.${c}`));
    if (key.parent) {
      const parent = byName.get(key.parent);
      assert.ok(parent, key.parent);
      assert.deepEqual(key.parentColumns, parent.keys.find(k => k.type === 'PRIMARY KEY').columns);
      assert.equal(key.columns.length, key.parentColumns.length);
    }
  }
}
function id(key) {
  const h = crypto.createHash('sha256').update('popup-erwin:' + key).digest('hex').slice(0, 32).toUpperCase();
  return `{${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}}+00000000`;
}
const esc = value => String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const tag = (name, value) => `<${name}>${esc(value)}</${name}>`;
const props = (name, values) => `<${name}>${Object.entries(values).filter(([,v]) => v != null).map(([k,v]) => tag(k,v)).join('')}</${name}>`;
function obj(type, key, name, values, body = '') {
  return `<${type} id="${id(key)}" name="${esc(name)}">${props(type+'Props', {Name:name,...values})}${body}</${type}>`;
}
function makeXml(base) {
  let entities = '', relations = '';
  for (const t of tables) {
    const pk = t.keys.find(k => k.type === 'PRIMARY KEY');
    let attributes = '', groups = '', ak = 0, fk = 0;
    for (const [index, c] of t.columns.entries()) {
      const foreign = t.keys.find(k => k.parent && k.columns.includes(c.name));
      const definition = [comments.get(`${t.name}.${c.name}`), c.defaultValue && `DEFAULT ${c.defaultValue}`].filter(Boolean).join('\n');
      attributes += obj('Attribute', `${t.name}.${c.name}`, labels[c.name], {
        Type: pk.columns.includes(c.name) ? 0 : 100, Physical_Name:c.name,
        Physical_Data_Type:c.type, Logical_Data_Type:c.type,
        Null_Option_Type:c.notNull ? 1 : 0, Attribute_Order:index, Column_Order:index,
        Definition:definition, Comment:definition,
        Parent_Attribute_Ref:foreign ? id(`${foreign.parent}.${foreign.parentColumns[foreign.columns.indexOf(c.name)]}`) : null,
        Parent_Relationship_Ref:foreign ? id(`rel.${foreign.name}`) : null,
      });
    }
    for (const k of t.keys) {
      const isForeign = k.type === 'FOREIGN KEY';
      const kind = k.type === 'PRIMARY KEY' ? 'PK' : isForeign ? `IF${++fk}` : `AK${++ak}`;
      const members = k.columns.map((c, i) => obj('Key_Group_Member', `${t.name}.${k.name}.${c}`, labels[c], {
        Attribute_Ref:id(`${t.name}.${c}`),
        Parent_Key_Group_Member_Ref:isForeign ? id(`${k.parent}.${byName.get(k.parent).keys.find(x => x.type === 'PRIMARY KEY').name}.${k.parentColumns[i]}`) : null,
      })).join('');
      groups += obj('Key_Group', `${t.name}.${k.name}`, k.name, {
        Key_Group_Type:kind, Physical_Name:k.name,
        Relationship_Ref:isForeign ? id(`rel.${k.name}`) : null,
      }, `<Key_Group_Member_Groups>${members}</Key_Group_Member_Groups>`);
      if (isForeign) {
        relations += obj('Relationship', `rel.${k.name}`, k.name, {
          Type:k.columns.every(c => pk.columns.includes(c)) ? 2 : 7,
          Parent_Entity_Ref:id(k.parent), Child_Entity_Ref:id(t.name),
          Key_Group_Ref:id(`${k.parent}.${byName.get(k.parent).keys.find(x => x.type === 'PRIMARY KEY').name}`),
          Definition:k.sql, Physical_Name:k.name,
        });
      }
    }
    entities += obj('Entity', t.name, tableNames[t.name], {
      Type:1, Physical_Name:t.name,
      Definition:[comments.get(t.name), ...t.checks].filter(Boolean).join('\n'),
      Comment:comments.get(t.name) || '',
    }, `<Attribute_Groups>${attributes}</Attribute_Groups><Key_Group_Groups>${groups}</Key_Group_Groups>`);
  }
  const env = props('ModelEnvProps', {Model_Type:3, Target_Server:1075858979, Target_Server_Version:10, Target_Server_Minor_Version:0});
  const model = props('ModelProps', {Name:'팝업 Oracle 현재 구조', Definition:'2026-09-24 저장소 Oracle DDL 기준. 삭제 후보 포함. XML 호환성 미검증. 전체 물리 DDL은 동봉 SQL 참조.'});
  return `<?xml version="1.0" encoding="UTF-8"?>\n<!-- Generated interchange draft; ERwin XSD/application validation is required. -->\n<ERwin xmlns="${base}" xmlns:EMX="${base}/data" Format="ERwin">\n<EMX:Model xmlns="${base}/data" id="${id('model')}" name="팝업 Oracle 현재 구조">${env}${model}<Entity_Groups>${entities}</Entity_Groups><Relationship_Groups>${relations}</Relationship_Groups></EMX:Model></ERwin>\n`.replace(/></g, '>\n<');
}
fs.mkdirSync(out, {recursive:true});
const prefix = 'popup_oracle_20260924';
// CA r7-r9 and later erwin namespaces are different. No product build number is invented.
fs.writeFileSync(path.join(out, `${prefix}_ca.xml`), makeXml('http://www.ca.com/erwin'));
fs.writeFileSync(path.join(out, `${prefix}_erwin.xml`), makeXml('http://www.erwin.com/dm').replace('<ERwin ', '<erwin ').replace('Format="ERwin"', 'Format="erwin"').replace('</ERwin>', '</erwin>'));
fs.writeFileSync(path.join(out, `${prefix}_reverse_engineer.sql`),
  '-- ERwin reverse engineering input only; source: db/oracle/01_popup_schema_oracle.sql\n' +
  '-- Tables, keys, checks, indexes, defaults, comments and sequences retained. No data or COMMIT.\n\n' +
  statements.filter(s => /^(CREATE (TABLE|SEQUENCE|(?:UNIQUE )?INDEX)|COMMENT ON)\b/.test(s)).map(s => s+';').join('\n\n')+'\n');
const summary = {source:'db/oracle/01_popup_schema_oracle.sql', sha256:crypto.createHash('sha256').update(source).digest('hex'),
  tables:tables.length, columns:tables.reduce((s,t)=>s+t.columns.length,0),
  primaryKeys:tables.length, foreignKeys:tables.flatMap(t=>t.keys).filter(k=>k.parent).length,
  uniqueKeys:tables.flatMap(t=>t.keys).filter(k=>k.type==='UNIQUE').length,
  checks:tables.reduce((s,t)=>s+t.checks.length,0),
  sequences:statements.filter(s=>s.startsWith('CREATE SEQUENCE ')).length,
  indexes:statements.filter(s=>/^CREATE (UNIQUE )?INDEX /.test(s)).length,
  xmlLimitations:['ERwin application/XSD compatibility unverified', 'CHECK/default/ON DELETE expressions retained as definitions, not executable XML objects', 'Standalone indexes and sequences included in SQL only', 'No diagram layout'],
  schema:tables};
fs.writeFileSync(path.join(out, `${prefix}_manifest.json`), JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify({...summary,schema:undefined},null,2));
