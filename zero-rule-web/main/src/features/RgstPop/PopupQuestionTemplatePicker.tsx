import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import type {
  AdminQuestionTemplate,
  PopupQuestion,
  PopupType,
} from '@local/domain';
import { useApi } from '@/provider';
import handleError from '@/lib/handle-error';

interface Props {
  popupType: PopupType;
  disabled: boolean;
  onBusy: (busy: boolean) => void;
  onChange: (questions: PopupQuestion[], templateId: number) => void;
}

export default function PopupQuestionTemplatePicker({
  popupType,
  disabled,
  onBusy,
  onChange,
}: Props) {
  const api = useApi();
  const [templates, setTemplates] = useState<AdminQuestionTemplate[]>([]);
  const [selected, setSelected] = useState('');
  useEffect(() => {
    let canceled = false;
    api.popupAdmin
      .questionTemplates()
      .then(({ body }) => {
        if (!canceled) setTemplates(body.templates);
      })
      .catch((error) => {
        if (!canceled) handleError(error);
      });
    return () => {
      canceled = true;
    };
  }, [api]);
  const load = async () => {
    onBusy(true);
    try {
      const { body } = await api.popupAdmin.questionTemplate({ templateId: Number(selected) });
      onChange(body.adminQuestions.map((entry) => entry.question), Number(selected));
    } catch (error) {
      handleError(error);
    } finally {
      onBusy(false);
    }
  };
  return (
    <Box component="fieldset" disabled={disabled} sx={{ border: 0, p: 0, m: 0, minWidth: 0 }}>
      <Stack spacing={2}>
        <Typography fontWeight={700}>문항 편집</Typography>
        <Stack direction="row" spacing={1}>
          <TextField
            select
            fullWidth
            size="small"
            label="기존 템플릿"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
          >
            <MenuItem value="">선택 안 함</MenuItem>
            {templates
              .filter((t) => t.templateType === popupType)
              .map((t) => (
                <MenuItem key={t.templateId} value={t.templateId}>
                  {t.templateName} ({t.templateId})
                </MenuItem>
              ))}
          </TextField>
          <Button disabled={disabled || !selected} onClick={load}>
            불러오기
          </Button>
        </Stack>
        <Typography variant="caption">
          불러오면 현재 문항이 교체됩니다. 수정한 문항은 저장 시 별도 템플릿으로 보관됩니다.
        </Typography>
      </Stack>
    </Box>
  );
}
