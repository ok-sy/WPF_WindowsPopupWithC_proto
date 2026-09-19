import { isEnterKeyEvent } from '@local/ui';
import ClearIcon from '@mui/icons-material/Clear';
import { IconButton, Stack, TextField, Tooltip } from '@mui/material';
import { useRef, useState } from 'react';
import type { CodeInput } from '../types';

type Props = {
  initialData?: Partial<CodeInput>;
  rowIndex: number;
  onMoveRow: (rowIndex: number, addition: 1 | -1) => void;
  onClickDelete: (event: React.MouseEvent) => void;
};

export default function CommonCodeEditRow(props: Props) {
  const { rowIndex, onClickDelete, onMoveRow } = props;
  const [input, setInput] = useState<Partial<CodeInput>>(() => props.initialData ?? {});
  const rootRef = useRef<HTMLDivElement | null>(null);

  const focus = (selector: string) => {
    // requestFocusSelector(rootRef.current, selector)
    const elem = document.querySelector(selector) as HTMLElement | null;
    if (elem) {
      elem.focus();
    }
  };

  const focusRowAt = (rowIndex: number, field: string) => {
    focus(`[data-row-index='${rowIndex}'][data-row-field='${field}'] input`);
  };

  // 입력값 변경
  const handleChangeInput =
    (field: keyof CodeInput) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value ?? '';
      const newValue = { ...input, [field]: value };
      setInput(newValue);
    };

  // 키보드 입력 이벤트
  const handleKeydownInput =
    (field: keyof CodeInput) => (event: React.KeyboardEvent<HTMLInputElement>) => {
      const valid = event.key === 'ArrowUp' || event.key === 'ArrowDown' || isEnterKeyEvent(event);
      if (!valid) return;

      if (event.key === 'ArrowUp') {
        if (event.shiftKey) {
          onMoveRow(rowIndex, -1);
        } else {
          focusRowAt(rowIndex - 1, field);
        }
      } else if (event.key === 'ArrowDown') {
        if (event.shiftKey) {
          onMoveRow(rowIndex, 1);
        } else {
          focusRowAt(rowIndex + 1, field);
        }
      } else if (isEnterKeyEvent(event)) {
        if (field === 'code') {
          focusRowAt(rowIndex, 'codeNm');
        } else if (field === 'codeNm') {
          focusRowAt(rowIndex, 'dtlExpl');
        } else if (field === 'dtlExpl') {
          focusRowAt(rowIndex + 1, 'code');
        }
      }
    };

  const { code, codeNm, dtlExpl } = input ?? {};
  return (
    <Stack direction="row" spacing={1} className="CommonCodeEditRow-root" ref={rootRef}>
      <TextField
        placeholder="코드"
        sx={{ flexBasis: 100 }}
        required
        size="small"
        margin="none"
        value={code ?? ''}
        data-row-field="code"
        data-row-index={rowIndex}
        onKeyDown={handleKeydownInput('code')}
        onChange={handleChangeInput('code')}
      />
      <TextField
        placeholder="코드 이름"
        required
        sx={{ flexBasis: 160 }}
        size="small"
        margin="none"
        value={codeNm ?? ''}
        data-row-field="codeNm"
        data-row-index={rowIndex}
        onKeyDown={handleKeydownInput('codeNm')}
        onChange={handleChangeInput('codeNm')}
      />
      <TextField
        size="small"
        margin="none"
        sx={{ flex: 1, minWidth: 160 }}
        className="CommonCodeEditForm-dtlExpl"
        placeholder="비고"
        data-row-field="dtlExpl"
        data-row-index={rowIndex}
        value={dtlExpl ?? ''}
        onKeyDown={handleKeydownInput('dtlExpl')}
        onChange={handleChangeInput('dtlExpl')}
      />
      <Tooltip title="삭제">
        <IconButton onClick={onClickDelete} size="small" data-row-index={rowIndex}>
          <ClearIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Stack>
  );
}
