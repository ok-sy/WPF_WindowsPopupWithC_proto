import CLDocLabelAny from '@/components/CLDocLabelAny/CLDocLabelAny';
import CLDocLabelInput from '@/components/CLDocLabelInput/CLDocLabelInput';
import CLStyledFormControlLabel from '@/components/CLStyledFormControlLabel/CLStyledFormControlLabel';
import SubTitleAndIcon from '@/components/SubTitleAndIcon';
import type { RuleInfoInputType, UpdateInsertAllData } from '@local/domain';
import type { SxProps } from '@mui/material';
import { Grid2, Radio, RadioGroup, Stack } from '@mui/material';

const rootSx: SxProps = {
  '& .CLDocLabelInput-root': {
    '& .CLDocLabelInput-titleBox': {
      minWidth: 90,
      maxWidth: 90,
    },
  },
  '& .CLDocLabelAny-root': {
    '& .CLDocLabelAny-titleBox': {
      minWidth: 90,
      maxWidth: 90,
    },
  },
};

type Props = {
  asisData?: UpdateInsertAllData;
  onSubmitData: (data: RuleInfoInputType) => void;
  readChecked: boolean;
};
export default function RuleInfo(props: Props) {
  const { asisData, onSubmitData, readChecked } = props;

  return (
    <Stack sx={rootSx} className="RuleInfo-root">
      <SubTitleAndIcon sx={{ mb: 0.5 }} labelTitle="룰" />
      <Grid2 mt={0.5} container spacing={0.5}>
        <Grid2 size={{ xs: 12, md: 6 }}>
          <CLDocLabelInput
            readOnly
            title="인터페이스명"
            value={asisData?.ifNm}
            onChange={(e) => {
              onSubmitData({
                ...asisData,
                ifNm: e.target.value,
              });
            }}
          />
        </Grid2>
        <Grid2 size={{ xs: 12, md: 3 }}>
          <CLDocLabelInput
            title="룰VER"
            readOnly
            value={
              asisData?.ruleVerno === undefined || asisData?.ruleVerno === 0
                ? ''
                : asisData.ruleVerno.toFixed(2)
            }
            onChange={(e) => {
              onSubmitData({
                ...asisData,
                ruleVerno: Number(e.target.value),
              });
            }}
          />
        </Grid2>
        <Grid2 size={{ xs: 12, md: 3 }}>
          <CLDocLabelInput
            title="룰상태"
            readOnly
            value={asisData?.ruleState}
            onChange={(e) => {
              onSubmitData({
                ...asisData,
                ruleState: e.target.value,
              });
            }}
          />
        </Grid2>
      </Grid2>
      <Grid2 container spacing={0.5}>
        <Grid2 size={{ xs: 12, md: 6 }}>
          <CLDocLabelInput
            title="룰명"
            readOnly={readChecked}
            value={asisData?.ruleNm}
            onChange={(e) => {
              onSubmitData({
                ...asisData,
                ruleNm: e.target.value,
              });
            }}
          />
        </Grid2>
        <Grid2 size={{ xs: 12, md: 3 }}>
          <CLDocLabelInput
            title="적용여부"
            readOnly
            value={
              asisData?.ruleApplyYn === 'N' ? '미적용' : asisData?.ruleApplyYn === 'Y' ? '적용' : ''
            }
            // onChange={(e) => {
            //   onSubmitData({
            //     ...asisData,
            //     ruleNm: e.target.value,
            //   })
            // }}
          />
        </Grid2>
      </Grid2>
      <Grid2 container spacing={0.5}>
        <Grid2 size={{ xs: 12, md: 6 }}>
          <CLDocLabelInput
            title="룰별칭명"
            readOnly={readChecked}
            value={asisData?.rulealiasNm ?? ''}
            onChange={(e) => {
              onSubmitData({
                ...asisData,
                rulealiasNm: e.target.value,
              });
            }}
          />
        </Grid2>
        <Grid2 size={{ xs: 12, md: 6 }}>
          <CLDocLabelInput
            title="룰설명"
            readOnly={readChecked}
            value={asisData?.ruleDesc ?? ''}
            onChange={(e) => {
              onSubmitData({
                ...asisData,
                ruleDesc: e.target.value,
              });
            }}
          />
        </Grid2>
      </Grid2>
      <Grid2 container spacing={0.5}>
        <Grid2 size={{ xs: 12, lg: 6, xl: 3 }}>
          <CLDocLabelAny title="룰종류">
            <RadioGroup value={asisData?.rulesortCd ?? '0'}>
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
                  control={
                    <Radio
                      disabled={readChecked || asisData?.ruleid !== undefined}
                      size="small"
                      onChange={(e) => {
                        onSubmitData({
                          ...asisData,
                          rulesortCd: e.target.value,
                        });
                      }}
                    />
                  }
                  label="테이블룰"
                />
                <CLStyledFormControlLabel
                  value="1"
                  control={
                    <Radio
                      disabled={readChecked || asisData?.ruleid !== undefined}
                      size="small"
                      onChange={(e) => {
                        onSubmitData({
                          ...asisData,
                          rulesortCd: e.target.value,
                        });
                      }}
                    />
                  }
                  label="DB룰"
                />
              </Stack>
            </RadioGroup>
          </CLDocLabelAny>
        </Grid2>
        <Grid2 size={{ xs: 12, lg: 6, xl: 3 }}>
          <CLDocLabelAny title="룰구분">
            <RadioGroup value={asisData?.ruleusageCd ?? 'M'}>
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
                  control={
                    <Radio
                      disabled={readChecked || asisData?.ruleid !== undefined}
                      size="small"
                      onChange={(e) => {
                        onSubmitData({
                          ...asisData,
                          ruleusageCd: e.target.value,
                        });
                      }}
                    />
                  }
                  label="메인룰"
                />
                <CLStyledFormControlLabel
                  value="S"
                  control={
                    <Radio
                      disabled={readChecked || asisData?.ruleid !== undefined}
                      size="small"
                      onChange={(e) => {
                        onSubmitData({
                          ...asisData,
                          ruleusageCd: e.target.value,
                        });
                      }}
                    />
                  }
                  label="서브룰"
                />
              </Stack>
            </RadioGroup>
          </CLDocLabelAny>
        </Grid2>
        <Grid2 size={{ xs: 12, md: 3 }}>
          <CLDocLabelInput title="수정자명" readOnly value={asisData?.updateUserid} />
        </Grid2>
        <Grid2 size={{ xs: 12, md: 3 }}>
          <CLDocLabelInput readOnly title="수정일시" value={asisData?.updateDatetime} />
        </Grid2>
      </Grid2>
      <Grid2 container spacing={0.5}>
        <Grid2 size={{ xs: 12, lg: 6, xl: 3 }}>
          <CLDocLabelAny title="리턴형식">
            <RadioGroup sx={{}} value={asisData?.rulereturnType ?? '0'}>
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
                  control={
                    <Radio
                      disabled={readChecked}
                      size="small"
                      onChange={(e) => {
                        onSubmitData({
                          ...asisData,
                          rulereturnType: e.target.value,
                        });
                      }}
                    />
                  }
                  label="단일값"
                />
                <CLStyledFormControlLabel
                  value="1"
                  control={
                    <Radio
                      disabled={readChecked}
                      size="small"
                      onChange={(e) => {
                        onSubmitData({
                          ...asisData,
                          rulereturnType: e.target.value,
                        });
                      }}
                    />
                  }
                  label="다중값"
                />
              </Stack>
            </RadioGroup>
          </CLDocLabelAny>
        </Grid2>
        <Grid2 size={{ xs: 12, lg: 6, xl: 3 }}>
          <CLDocLabelAny title="계속점검여부">
            <RadioGroup value={asisData?.allreturnYn ?? 'N'}>
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
                  control={
                    <Radio
                      disabled={readChecked}
                      size="small"
                      onChange={(e) => {
                        onSubmitData({
                          ...asisData,
                          allreturnYn: e.target.value,
                        });
                      }}
                    />
                  }
                  label="N"
                />
                <CLStyledFormControlLabel
                  value={'Y'}
                  control={
                    <Radio
                      disabled={readChecked}
                      size="small"
                      onChange={(e) => {
                        onSubmitData({
                          ...asisData,
                          allreturnYn: e.target.value,
                        });
                      }}
                    />
                  }
                  label="Y"
                />
              </Stack>
            </RadioGroup>
          </CLDocLabelAny>
        </Grid2>
        <Grid2 size={{ xs: 12, md: 3 }}>
          <CLDocLabelInput title="적용자명" readOnly value={asisData?.deployUserid ?? ''} />
        </Grid2>
        <Grid2 size={{ xs: 12, md: 3 }}>
          <CLDocLabelInput readOnly title="적용일시" value={asisData?.deployDatetime ?? ''} />
        </Grid2>
      </Grid2>
    </Stack>
  );
}
