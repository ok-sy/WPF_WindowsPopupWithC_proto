import { useState } from 'react';
import { TextField, type TextFieldProps } from '@mui/material';

/** 빈 칸 처리 방식. commit: 비우는 즉시 null 반영 · onBlur: 입력을 마칠 때(포커스 이동) null 반영 · keep: 반영하지 않고 입력을 마치면 이전 값으로 되돌림. */
export type PopupNumberFieldEmpty = 'commit' | 'onBlur' | 'keep';

export type PopupNumberFieldProps = Omit<TextFieldProps, 'value' | 'onChange' | 'type' | 'onBlur'> & {
  value: number | null | undefined;
  onChange: (value: number | null) => void;
  empty?: PopupNumberFieldEmpty;
  /** true면 정수만 받는다(창 크기·우선순위·개수 등). 소수점·지수(.,eE+-) 키를 막고, 붙여 넣은 소수는 반영하지 않는다. */
  integer?: boolean;
};

/** 정수 칸에서 막는 키. 숫자 칸(type=number)은 이 글자들을 받아 560.5·5e2 같은 값을 만든다. */
const NON_INTEGER_KEYS = new Set(['.', ',', 'e', 'E', '+', '-']);

/**
 * POL-03-03 : 편집 UI
 * ■ 숫자 입력칸
 * - in : value(number | null | undefined) 저장된 값 · onChange(value) 숫자 또는 null · empty(PopupNumberFieldEmpty, 기본 commit) 빈 칸 처리 · 그 밖의 TextField props
 * - out: 화면: 숫자 TextField
 * - 입력 중 글자(draft)를 따로 들고 있다가 숫자로 읽히면 바로 반영한다. 입력을 마치면(blur) 저장된 값 표시로 돌아간다.
 *   이전에는 `Number(e.target.value)`를 바로 넣어 마지막 자리를 지우면 0이 다시 표시되거나(빈 칸 → 0),
 *   비운 값을 다른 로직(이미지 높이 자동 등)이 곧바로 다시 채워 마지막 자리가 지워지지 않았다(2026-11-25).
 *   범위 보정은 하지 않는다(부모가 onChange에서 보정). 입력 중 보정된 값은 blur 뒤에 보인다.
 * - integer: 정수 칸의 소수점 방어(2026-11-25). 키 입력을 막고, 붙여 넣기 등으로 들어온 정수 아닌 글자는 화면·값 모두 반영하지 않는다.
 *   저장 검사에서도 Number.isInteger로 한 번 더 확인한다(부모).
 */
export default function PopupNumberField({ value, onChange, empty = 'commit', integer = false, onKeyDown, ...props }: PopupNumberFieldProps) {
  const [draft, setDraft] = useState<string | null>(null);
  return <TextField {...props} type="number" value={draft ?? (value ?? '')}
    onKeyDown={(event) => {
      if (integer && NON_INTEGER_KEYS.has(event.key)) event.preventDefault();
      onKeyDown?.(event);
    }}
    onChange={(event) => {
      const input = event.target.value;
      if (integer && !/^\d*$/.test(input)) return;
      setDraft(input);
      if (input === '') { if (empty === 'commit') onChange(null); return; }
      const number = Number(input);
      if (Number.isFinite(number)) onChange(number);
    }}
    onBlur={() => {
      if (draft === '' && empty === 'onBlur') onChange(null);
      setDraft(null);
    }} />;
}
