import { ButtonBase, Stack, Typography } from '@mui/material';
import type { CustomGridFilterNumType, CustomGridFilterType } from '../grid-type';
type Props = {
  isStr?: boolean;
  onSubmit?: (oper: CustomGridFilterType['operator']) => void;
  onSubmitNum?: (oper: CustomGridFilterNumType['numOperator']) => void;
};
export default function TextFilterPopover(props: Props) {
  const { onSubmit, isStr = false, onSubmitNum } = props;
  if (isStr) {
    return (
      <Stack direction="column" alignItems="flex-start">
        <ButtonBase
          onClick={() => {
            if (!onSubmit) return;
            onSubmit('contain');
          }}
          sx={{ width: '100%', borderBottom: '1px solid #e0e0e0' }}
        >
          <Stack p={1} direction="row" justifyContent="space-between" sx={{ width: '100%' }}>
            <Typography fontSize={14} variant="subtitle1">
              Contain{' '}
            </Typography>
            <Typography fontSize={14} variant="subtitle1">
              (포함)
            </Typography>
          </Stack>
        </ButtonBase>
        <ButtonBase
          onClick={() => {
            if (!onSubmit) return;
            onSubmit('equals');
          }}
          sx={{ width: '100%', borderBottom: '1px solid #e0e0e0' }}
        >
          <Stack p={1} direction="row" justifyContent="space-between" sx={{ width: '100%' }}>
            <Typography fontSize={14} variant="subtitle1">
              Equls
            </Typography>
            <Typography fontSize={14} variant="subtitle1">
              (==)
            </Typography>
          </Stack>
        </ButtonBase>
        <ButtonBase
          onClick={() => {
            if (!onSubmit) return;
            onSubmit('notEquals');
          }}
          sx={{ width: '100%' }}
        >
          <Stack p={1} direction="row" justifyContent="space-between" sx={{ width: '100%' }}>
            <Typography fontSize={14} variant="subtitle1">
              Not Equls
            </Typography>
            <Typography fontSize={14} variant="subtitle1">
              (!=)
            </Typography>
          </Stack>
        </ButtonBase>
      </Stack>
    );
  }
  return (
    <Stack direction="column" alignItems="flex-start">
      <ButtonBase
        onClick={() => {
          if (!onSubmitNum) return;
          onSubmitNum('between');
        }}
        sx={{ width: '100%', borderBottom: '1px solid #e0e0e0' }}
      >
        <Stack p={1} direction="row" justifyContent="space-between" sx={{ width: '100%' }}>
          <Typography fontSize={14} variant="subtitle1">
            between
          </Typography>
        </Stack>
      </ButtonBase>
      <ButtonBase
        onClick={() => {
          if (!onSubmitNum) return;
          onSubmitNum('=');
        }}
        sx={{ width: '100%', borderBottom: '1px solid #e0e0e0' }}
      >
        <Stack p={1} direction="row" justifyContent="space-between" sx={{ width: '100%' }}>
          <Typography fontSize={14} variant="subtitle1">
            =
          </Typography>
        </Stack>
      </ButtonBase>
      <ButtonBase
        onClick={() => {
          if (!onSubmitNum) return;
          onSubmitNum('!=');
        }}
        sx={{ width: '100%', borderBottom: '1px solid #e0e0e0' }}
      >
        <Stack p={1} direction="row" justifyContent="space-between" sx={{ width: '100%' }}>
          <Typography fontSize={14} variant="subtitle1">
            !=
          </Typography>
        </Stack>
      </ButtonBase>
      <ButtonBase
        onClick={() => {
          if (!onSubmitNum) return;
          onSubmitNum('<');
        }}
        sx={{ width: '100%', borderBottom: '1px solid #e0e0e0' }}
      >
        <Stack p={1} direction="row" justifyContent="space-between" sx={{ width: '100%' }}>
          <Typography fontSize={14} variant="subtitle1">
            {'<'}
          </Typography>
          <Typography fontSize={14} variant="subtitle1">
            (작다)
          </Typography>
        </Stack>
      </ButtonBase>
      <ButtonBase
        onClick={() => {
          if (!onSubmitNum) return;
          onSubmitNum('<=');
        }}
        sx={{ width: '100%', borderBottom: '1px solid #e0e0e0' }}
      >
        <Stack
          p={1}
          spacing={2}
          direction="row"
          justifyContent="space-between"
          sx={{ width: '100%' }}
        >
          <Typography fontSize={14} variant="subtitle1">
            {'<='}
          </Typography>
          <Typography fontSize={14} variant="subtitle1">
            (작거나 같다)
          </Typography>
        </Stack>
      </ButtonBase>
      <ButtonBase
        onClick={() => {
          if (!onSubmitNum) return;
          onSubmitNum('>');
        }}
        sx={{ width: '100%', borderBottom: '1px solid #e0e0e0' }}
      >
        <Stack p={1} direction="row" justifyContent="space-between" sx={{ width: '100%' }}>
          <Typography fontSize={14} variant="subtitle1">
            {'>'}
          </Typography>
          <Typography fontSize={14} variant="subtitle1">
            (크다)
          </Typography>
        </Stack>
      </ButtonBase>
      <ButtonBase
        onClick={() => {
          if (!onSubmitNum) return;
          onSubmitNum('>=');
        }}
        sx={{ width: '100%' }}
      >
        <Stack p={1} direction="row" justifyContent="space-between" sx={{ width: '100%' }}>
          <Typography fontSize={14} variant="subtitle1">
            {'>='}
          </Typography>
          <Typography fontSize={14} variant="subtitle1">
            (크거나 같다)
          </Typography>
        </Stack>
      </ButtonBase>
    </Stack>
  );
}
