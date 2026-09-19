import CLDocLabelAny from '@/components/CLDocLabelAny/CLDocLabelAny';
import CLDocLabelInput from '@/components/CLDocLabelInput/CLDocLabelInput';
import CLStyledFormControlLabel from '@/components/CLStyledFormControlLabel/CLStyledFormControlLabel';
import SubTitleAndIcon from '@/components/SubTitleAndIcon';
import type { RuleVerstionData } from '@local/domain';
import type { SxProps } from '@mui/material';
import { Grid2, Radio, RadioGroup, Stack } from '@mui/material';

type Props = {
  data: RuleVerstionData;
  ifNm: string;
};
const rootSx: SxProps = {
  '& .CLDocLabelInput-root': {
    '& .CLDocLabelInput-titleBox': {
      minWidth: 120,
      maxWidth: 120,
    },
  },
  '& .CLDocLabelAny-root': {
    '& .CLDocLabelAny-titleBox': {
      minWidth: 120,
      maxWidth: 120,
    },
  },
};
export default function HstRuleInfo(props: Props) {
  const { data, ifNm } = props;
  return (
    <Stack sx={rootSx} className="RuleInfo-root">
      <SubTitleAndIcon sx={{ mb: 0.5 }} labelTitle="RULE" />
      <Grid2 mt={0.5} container spacing={0.5}>
        <Grid2 size={{ xs: 12, md: 6 }}>
          <CLDocLabelInput readOnly title="인터페이스명" value={ifNm} />
        </Grid2>
        <Grid2 size={{ xs: 12, md: 3 }}>
          <CLDocLabelInput
            title="룰VER"
            readOnly
            value={
              data?.ruleVerno === undefined || data?.ruleVerno === 0
                ? ''
                : data.ruleVerno.toFixed(2)
            }
          />
        </Grid2>
        <Grid2 size={{ xs: 12, md: 3 }}>
          <CLDocLabelInput title="룰상태" readOnly value={data?.ruleState} />
        </Grid2>
      </Grid2>
      <Grid2 container spacing={0.5}>
        <Grid2 size={{ xs: 12, md: 6 }}>
          <CLDocLabelInput title="RULE명" readOnly value={data?.ruleNm} />
        </Grid2>
        <Grid2 size={{ xs: 12, md: 6 }}>
          <CLDocLabelInput title="RULE별칭명" readOnly value={data?.rulealiasNm} />
        </Grid2>
      </Grid2>
      <Grid2 container>
        <Grid2 size={{ xs: 12 }}>
          <CLDocLabelInput title="RULE설명" readOnly value={data?.ruleDesc} />
        </Grid2>
      </Grid2>
      <Grid2 container spacing={0.5}>
        <Grid2 size={{ xs: 12, lg: 6, xl: 3 }}>
          <CLDocLabelAny title="RULE종류">
            <RadioGroup value={data?.rulesortCd ?? '0'}>
              <Stack
                alignItems="center"
                direction="row"
                sx={{
                  pl: 1,
                  whiteSpace: 'nowrap',
                  minHeight: 32.4,
                  '& .MuiButtonBase-root': { width: 10, height: 10, mr: 1 },
                }}
              >
                <CLStyledFormControlLabel
                  value="0"
                  control={<Radio disabled size="small" />}
                  label="테이블룰"
                />
                <CLStyledFormControlLabel
                  value="1"
                  control={<Radio disabled size="small" />}
                  label="DB룰"
                />
              </Stack>
            </RadioGroup>
          </CLDocLabelAny>
        </Grid2>
        <Grid2 size={{ xs: 12, lg: 6, xl: 3 }}>
          <CLDocLabelAny title="룰구분">
            <RadioGroup value={data?.ruleusageCd ?? 'M'}>
              <Stack
                alignItems="center"
                direction="row"
                sx={{
                  pl: 1,
                  whiteSpace: 'nowrap',
                  minHeight: 32.4,
                  '& .MuiButtonBase-root': { width: 10, height: 10, mr: 1 },
                }}
              >
                <CLStyledFormControlLabel
                  value="M"
                  control={<Radio disabled size="small" />}
                  label="메인룰"
                />
                <CLStyledFormControlLabel
                  value="S"
                  control={<Radio disabled size="small" />}
                  label="서브룰"
                />
              </Stack>
            </RadioGroup>
          </CLDocLabelAny>
        </Grid2>
        <Grid2 size={{ xs: 12, md: 3 }}>
          <CLDocLabelInput title="수정자명" readOnly value={data?.updateUserid} />
        </Grid2>
        <Grid2 size={{ xs: 12, md: 3 }}>
          <CLDocLabelInput readOnly title="수정일시" value={data?.updateDatetime} />
        </Grid2>
      </Grid2>
      <Grid2 container spacing={0.5}>
        <Grid2 size={{ xs: 12, lg: 6, xl: 3 }}>
          <CLDocLabelAny title="리턴형식">
            <RadioGroup value={data?.rulereturnType ?? '0'}>
              <Stack
                alignItems="center"
                direction="row"
                sx={{
                  pl: 1,
                  whiteSpace: 'nowrap',
                  minHeight: 32.4,
                  '& .MuiButtonBase-root': { width: 10, height: 10, mr: 1 },
                }}
              >
                <CLStyledFormControlLabel
                  value="0"
                  control={<Radio disabled size="small" />}
                  label="단일값"
                />
                <CLStyledFormControlLabel
                  value="1"
                  control={<Radio disabled size="small" />}
                  label="다중값"
                />
              </Stack>
            </RadioGroup>
          </CLDocLabelAny>
        </Grid2>
        <Grid2 size={{ xs: 12, lg: 6, xl: 3 }}>
          <CLDocLabelAny title="계속점검여부">
            <RadioGroup value={data?.allreturnYn ?? 'N'}>
              <Stack
                alignItems="center"
                direction="row"
                sx={{
                  pl: 1,
                  whiteSpace: 'nowrap',
                  minHeight: 32.4,
                  '& .MuiButtonBase-root': { width: 10, height: 10, mr: 1 },
                }}
              >
                <CLStyledFormControlLabel
                  value={'N'}
                  control={<Radio disabled size="small" />}
                  label="N"
                />
                <CLStyledFormControlLabel
                  value={'Y'}
                  control={<Radio disabled size="small" />}
                  label="Y"
                />
              </Stack>
            </RadioGroup>
          </CLDocLabelAny>
        </Grid2>
        <Grid2 size={{ xs: 12, md: 3 }}>
          <CLDocLabelInput title="적용자명" readOnly value={data?.deployUserid} />
        </Grid2>
        <Grid2 size={{ xs: 12, md: 3 }}>
          <CLDocLabelInput readOnly title="적용일시" value={data?.deployDatetime} />
        </Grid2>
      </Grid2>
    </Stack>
  );
}
