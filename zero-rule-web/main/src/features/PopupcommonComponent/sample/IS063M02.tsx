// @ts-nocheck -- 퍼블리싱 대조용 원본(사진 전사본). 저장소에 없는 IS035Info·폐쇄망 전역 n* CSS에 의존하므로 타입 검사에서 제외한다. 공통 기능 연결본은 IS063M02Sample.tsx.
// 사진 15장 기반 전사본. 원본 동작을 유지했으며, 누락 구간은 OCR_RESTORE_NOTES.md 참고.
import * as React from 'react';
import { ThemeProvider } from '@emotion/react';
import BbsCKEditor from '@/components/BbsCKEditor';
import theme from '@/theme';
import {
  Box,
  Breadcrumbs,
  Button,
  FormControlLabel,
  IconButton,
  Link,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import type { CLCode, IS035Info } from '@local/domain/src';
import { Add, DisabledByDefaultOutlined, Remove } from '@mui/icons-material';
import { NavigateNext } from '@mui/icons-material';
// import CLDocDatePicker from '@/components/CLDocDatePicker';
import { useCallback, useState } from 'react';

export type IS063M0Props = {
  open: boolean;
  data?: IS035Info;
  onClose: () => void;
  returnData: (data: any) => void;
  msg?: string;
  codes: CLCode[];
};

export default function IS063M0(props: IS063M0Props) {
  const { data } = props;
  const [inputData, setInputData] = useState<string>(data?.dtlCn ?? '');
  const updateInput = useCallback((data: string) => setInputData(data), []);
  const [selectedValue, setSelectedValue] = React.useState('1');
  const [displayStatus, setDisplayStatus] = React.useState('1');
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedValue(event.target.value);
  };
  const handleSelectChange = (event) => {
    setDisplayStatus(event.target.value);
  };
  const controlProps = (item: string) => ({
    checked: selectedValue === item,
    onChange: handleChange,
    value: item,
    name: 'radio-group',
    inputProps: { 'aria-label': item },
  });

  return (
    <ThemeProvider theme={theme}>
      {/* nContainer : s */}
      <Box className="nContainer">
        {/* nContent : s */}
        <Box className="nContent">
          {/* nBreadArea : s */}
          <Box className="nBreadArea">
            <Breadcrumbs className="nBreadNav" separator={<NavigateNext fontSize="small" />}>
              <Link underline="hover">HOME</Link>
              <Link underline="hover">관리/교육</Link>
              <Link underline="hover">팝업관리</Link>
              <Link underline="hover">컨텐츠 관리</Link>
              <Typography>컨텐츠 등록</Typography>
            </Breadcrumbs>
          </Box>
          {/* nBreadArea : e */}
          {/* nResultArea : s */}
          <Box className="nResultArea">
            {/* nResultBox left : s */}
            <Box className="nDevider">
              {/* 컨텐츠정보 : s */}
              <Box className="nConSection">
                <Box component="h4" className="nConTitle">컨텐츠 정보</Box>
                <Box className="nConID">
                  <Typography className="nConSectionTitle">팝업ID</Typography>
                  <Typography className="nConSectionTitle">N2609001</Typography>
                </Box>
                <Stack className="nConSectionDiv">
                  <Typography className="nConSectionTitle">
                    <Typography component="span" className="required">*&nbsp;</Typography>컨텐츠 유형
                  </Typography>
                  <Select defaultValue={1}>
                    <MenuItem value={1}>선택하세요</MenuItem>
                    <MenuItem value={2}>텍스트 팝업</MenuItem>
                    <MenuItem value={3}>이미지 팝업</MenuItem>
                    <MenuItem value={4}>동영상 팝업</MenuItem>
                    <MenuItem value={5}>퀴즈 팝업</MenuItem>
                    <MenuItem value={6}>설문조사 팝업</MenuItem>
                    <MenuItem value={7}>동영상 + 퀴즈 팝업</MenuItem>
                  </Select>
                  <Box className="nConBtnBox">
                    <Button variant="contained">폼 생성</Button>
                    <Button variant="contained" className="nWhiteBtn">불러오기</Button>
                  </Box>
                </Stack>
              </Box>
              {/* 컨텐츠정보 : e */}
              {/* 팝업설정 : s */}
              <Box className="nConSection">
                <Box component="h4" className="nConTitle">팝업 설정</Box>
                <Stack className="nConSectionDiv">
                  <Typography className="nConSectionTitle">
                    <Typography component="span" className="required">*&nbsp;</Typography>컨텐츠 명
                  </Typography>
                  <TextField placeholder="컨텐츠명을 입력하세요" sx={{ width: '100%' }} />
                </Stack>
                <Stack className="nConSectionDiv">
                  <Typography className="nConSectionTitle">
                    <Typography component="span" className="required">*&nbsp;</Typography>헤더 제목
                  </Typography>
                  <TextField placeholder="제목을 입력하세요" sx={{ width: '100%' }} />
                </Stack>
                <Stack className="nConSectionDiv">
                  <Typography className="nConSectionTitle"><Typography component="span" className="required">*&nbsp;</Typography>크기 설정</Typography>
                  <Box className="nConWid">
                    <Typography component="span">가로</Typography>
                    <TextField placeholder="최소 200" sx={{ width: 70, marginX: 1 }} />
                    <Typography component="span">px</Typography>
                  </Box>
                  <Typography component="span" sx={{ marginX: 1 }}>/</Typography>
                  <Box className="nConWid">
                    <Typography component="span">세로</Typography>
                    <TextField placeholder="최소 200" sx={{ width: 70, marginX: 1 }} />
                    <Typography component="span">px</Typography>
                  </Box>
                </Stack>
                <Stack className="nConSectionDiv">
                  <Typography className="nConSectionTitle"><Typography component="span" className="required not">*&nbsp;</Typography>나중에 보기</Typography>
                  <Switch className="ios-switch" disableRipple defaultChecked={true} />
                </Stack>
                <Stack className="nConSectionDiv">
                  <Typography className="nConSectionTitle">
                    <Typography component="span" className="required not">*&nbsp;</Typography>푸터버튼명
                  </Typography>
                  <Select defaultValue={1} onChange={handleSelectChange}>
                    <MenuItem value={1}>확인</MenuItem>
                    <MenuItem value={2}>바로가기</MenuItem>
                  </Select>
                  {/* 퀴즈팝업, 설문조사, 동영상+퀴즈 팝업일 시 제출 기본선택, 비활성화
                  <Select defaultValue={1} disabled>
                    <MenuItem value={1}>제출</MenuItem>
                  </Select>
                  */}
                </Stack>
                {/* 바로가기 선택 시에만 URL 입력란 노출 */}
                {displayStatus === '2' && (
                  <Stack className="nConSectionDiv">
                    <Typography className="nConSectionTitle">
                      <Typography component="span" className="required not">*&nbsp;</Typography>URL 링크
                    </Typography>
                    <TextField placeholder="" sx={{ width: '100%' }} />
                  </Stack>
                )}
              </Box>
              {/* 팝업설정 : e */}
            </Box>
            {/* nResultBox left : e */}
            {/* nResultBox mid : s */}
            <Box className="nDevider">
              {/* 유형에 따라 타이틀 변경(텍스트 컨텐츠, 이미지 컨텐츠, 퀴즈 컨텐츠, 동영상 컨텐츠, 설문조사 컨텐츠, 동영상 + 퀴즈 컨텐츠) */}
              <Box component="h4" className="nConTitle">텍스트 컨텐츠</Box>
              {/* CKEditor
              <BbsCKEditor
                content={inputData}
                className="nConEditStyle"
                onContentChange={(content) => updateInput(content ?? '')}
              />
              */}
              {/* 이미지, 동영상 파일 첨부 */}
              <Box className="nFormBox">
                <Box className="nFormLine" sx={{ gap: '5px' }}>
                  <Box className="nFileWrap">
                    <List className="nFileList">
                      <ListItem>
                        <ListItemText>
                          {/* 이미지, 동영상 파일명 */}
                          <Link>파일 첨부 이미지.jpg</Link>
                          <IconButton className="nDeleteIcon">
                            <DisabledByDefaultOutlined />
                          </IconButton>
                        </ListItemText>
                      </ListItem>
                    </List>
                    {/* 동영상 파일 첨부 시 URL 신규생성(서버경로, 내용수정불가) */}
                    <Box className="nConID" sx={{ marginTop: 2 }}>
                      <Link>http://URL</Link>
                    </Box>
                  </Box>
                  <span className="nAddFile02">
                    <label>
                      <Add sx={{ fontSize: '16px' }} />
                      파일첨부
                      <input type="file" />
                    </label>
                  </span>
                </Box>
              </Box>
              {/* 이미지 컨텐츠일 경우 안내문구 */}
              <Typography component="span" sx={{ color: '#333' }}>※ BMP, GIF, JPG, PNG 파일만 등록 가능합니다.</Typography>
              {/* 동영상 컨텐츠일 경우 안내문구
              <Typography component="span" sx={{ color: '#333' }}>※ MP4 파일만 등록 가능합니다.</Typography>
              */}
              {/* 퀴즈 컨텐츠일 경우 : s */}
                <Stack className="nConSectionDiv">
                  <Typography className="nConSectionTitle"><Typography component="span" className="required not">*&nbsp;</Typography>설명</Typography>
                  <BbsCKEditor
                    content={inputData}
                    className="nConEditStyle"
                    sx={{ height: '100px', width: '100%' }}
                    onContentChange={(content) => updateInput(content ?? '')}
                  />
                </Stack>
              <Stack className="nConSectionDiv">
                <Typography className="nConSectionTitle"><Typography component="span" className="required">*&nbsp;</Typography>퀴즈유형</Typography>
                <Select defaultValue={1}>
                  <MenuItem value={1}>선택하세요</MenuItem>
                  <MenuItem value={2}>만점 통과</MenuItem>
                  <MenuItem value={3}>커트라인 통과</MenuItem>
                  <MenuItem value={4}>통과/실패 제출</MenuItem>
                </Select>
                {/* 커트라인 통과일 경우
                <TextField placeholder="" sx={{ width: 40, textAlign: 'center' }} />
                <Typography component="span">개 이상 통과</Typography>
                */}
                {/* 통과/실패 제출일 경우 */}
                <TextField placeholder="" sx={{ width: 40, textAlign: 'center' }} />
                <Typography component="span">개 이상 통과 / 미만 실패</Typography>
              </Stack>
              {/* 퀴즈 1개 영역 : s */}
              <Box className="nQuizBox">
                <Stack className="nConSectionDiv">
                  <Typography className="nConSectionTitle"><Typography component="span" className="required">*&nbsp;</Typography>퀴즈 1</Typography>
                  <BbsCKEditor
                    content={inputData}
                    className="nConEditStyle"
                    sx={{ height: '60px', width: '100%' }}
                    onContentChange={(content) => updateInput(content ?? '')}
                  />
                </Stack>
                <Stack className="nConSectionDiv">
                  <Typography className="nConSectionTitle"><Typography component="span" className="required">*&nbsp;</Typography>답변 유형</Typography>
                  <Select defaultValue={1}>
                    <MenuItem value={1}>선택하세요</MenuItem>
                    <MenuItem value={2}>OX형</MenuItem>
                    <MenuItem value={3}>선다형</MenuItem>
                  </Select>
                </Stack>
                {/* 답변 유형이 OX일 경우 */}
                <Stack className="nConSectionDiv">
                  <Typography className="nConSectionTitle"><Typography component="span" className="required">*&nbsp;</Typography>답변 항목</Typography>
                  <RadioGroup row defaultValue={1} sx={{ justifyContent: 'center' }}>
                    <FormControlLabel
                      value="1"
                      control={<Radio size="small" />}
                      label="O"
                    />
                    <FormControlLabel
                      value="2"
                      control={<Radio size="small" />}
                      label="X"
                    />
                  </RadioGroup>
                </Stack>

                <Stack className="nConSectionDiv">
                  <Typography className="nConSectionTitle"><Typography component="span" className="required">*&nbsp;</Typography>답변 항목</Typography>
                  <Stack className="nConAnswerDiv">
                    <List className="nAnswerGroup">
                      <ListItem className="nAnswer">
                        <FormControlLabel
                          control={
                            <Radio {...controlProps('1')} size="small" />
                          }
                          label
                        />
                        <TextField placeholder="" sx={{ width: '100%' }} />
                        <IconButton className="nQuizBtn">
                          <Remove />
                        </IconButton>
                      </ListItem>
                      <ListItem className="nAnswer">
                        <FormControlLabel
                          control={
                            <Radio {...controlProps('2')} size="small" />
                          }
                          label
                        />
                        <TextField placeholder="" sx={{ width: '100%' }} />
                        <IconButton className="nQuizBtn">
                          <Remove />
                        </IconButton>
                      </ListItem>
                      <ListItem className="nAnswer">
                        <FormControlLabel
                          control={
                            <Radio {...controlProps('3')} size="small" />
                          }
                          label
                        />
                        <TextField placeholder="" sx={{ width: '100%' }} />
                        <IconButton className="nQuizBtn">
                          <Remove />
                        </IconButton>
                      </ListItem>
                      <ListItem className="nAnswer">
                        <FormControlLabel
                          control={
                            <Radio {...controlProps('4')} size="small" />
                          }
                          label
                        />
                        <TextField placeholder="" sx={{ width: '100%' }} />
                        <IconButton className="nQuizBtn">
                          <Remove />
                        </IconButton>
                      </ListItem>
                      <ListItem className="nAnswer">
                        <FormControlLabel
                          control={
                            <Radio {...controlProps('5')} size="small" />
                          }
                          label
                        />
                        <TextField placeholder="" sx={{ width: '100%' }} />
                        <IconButton className="nQuizBtn">
                          <Remove />
                        </IconButton>
                      </ListItem>
                    </List>
                    <Box className="nQuizBtnGroup">
                      <IconButton className="nQuizBtn">
                        <Add />
                      </IconButton>
                    </Box>
                  </Stack>
                </Stack>
              </Box>
              {/* 퀴즈 1개 영역 : e */}
              <Box className="nQuizBox">
                <Box className="nQuizBtnGroup" sx={{ marginBottom: 1 }}>
                  <Button variant="contained">삭제</Button>
                </Box>
                <Stack className="nConSectionDiv">
                  <Typography className="nConSectionTitle"><Typography component="span" className="required">*&nbsp;</Typography>퀴즈 2</Typography>
                  <BbsCKEditor
                    content={inputData}
                    className="nConEditStyle"
                    sx={{ height: '60px', width: '100%' }}
                    onContentChange={(content) => updateInput(content ?? '')}
                  />
                </Stack>
                <Stack className="nConSectionDiv">
                  <Typography className="nConSectionTitle"><Typography component="span" className="required">*&nbsp;</Typography>답변 유형</Typography>
                  <Select defaultValue={1}>
                    <MenuItem value={1}>선택하세요</MenuItem>
                    <MenuItem value={2}>OX형</MenuItem>
                    <MenuItem value={3}>선다형</MenuItem>
                  </Select>
                </Stack>
                {/* 답변 유형이 OX일 경우
                <Stack className="nConSectionDiv">
                  <Typography className="nConSectionTitle"><Typography component="span" className="required">*&nbsp;</Typography>답변 항목</Typography>
                  <RadioGroup row defaultValue={1} sx={{ justifyContent: 'center' }}>
                    <FormControlLabel
                      value="1"
                      control={<Radio size="small" />}
                      label="O"
                    />
                    <FormControlLabel
                      value="2"
                      control={<Radio size="small" />}
                      label="X"
                    />
                  </RadioGroup>
                </Stack>
                */}
                <Stack className="nConSectionDiv">
                  <Typography className="nConSectionTitle"><Typography component="span" className="required">*&nbsp;</Typography>답변 항목</Typography>
                  <Stack className="nConAnswerDiv">
                    <List className="nAnswerGroup">
                      <ListItem className="nAnswer">
                        <FormControlLabel
                          control={
                            <Radio {...controlProps('1')} size="small" />
                          }
                          label
                        />
                        <TextField placeholder="" sx={{ width: '100%' }} />
                        <IconButton className="nQuizBtn">
                          <Remove />
                        </IconButton>
                      </ListItem>
                      <ListItem className="nAnswer">
                        <FormControlLabel
                          control={
                            <Radio {...controlProps('2')} size="small" />
                          }
                          label
                        />
                        <TextField placeholder="" sx={{ width: '100%' }} />
                        <IconButton className="nQuizBtn">
                          <Remove />
                        </IconButton>
                      </ListItem>
                      <ListItem className="nAnswer">
                        <FormControlLabel
                          control={
                            <Radio {...controlProps('3')} size="small" />
                          }
                          label
                        />
                        <TextField placeholder="" sx={{ width: '100%' }} />
                        <IconButton className="nQuizBtn">
                          <Remove />
                        </IconButton>
                      </ListItem>
                      <ListItem className="nAnswer">
                        <FormControlLabel
                          control={
                            <Radio {...controlProps('4')} size="small" />
                          }
                          label
                        />
                        <TextField placeholder="" sx={{ width: '100%' }} />
                        <IconButton className="nQuizBtn">
                          <Remove />
                        </IconButton>
                      </ListItem>
                      <ListItem className="nAnswer">
                        <FormControlLabel
                          control={
                            <Radio {...controlProps('5')} size="small" />
                          }
                          label
                        />
                        <TextField placeholder="" sx={{ width: '100%' }} />
                        <IconButton className="nQuizBtn">
                          <Remove />
                        </IconButton>
                      </ListItem>
                    </List>
                    <Box className="nQuizBtnGroup">
                      <IconButton className="nQuizBtn">
                        <Add />
                      </IconButton>
                    </Box>
                  </Stack>
                </Stack>
              </Box>
              <Box className="nQuizBtnGroup" sx={{ marginTop: 1 }}>
                <Button variant="contained">퀴즈추가</Button>
              </Box>
              {/* 퀴즈 컨텐츠일 경우 : e */}
              {/* 설문조사 컨텐츠일 경우 : s */}
                <Stack className="nConSectionDiv">
                  <Typography className="nConSectionTitle"><Typography component="span" className="required not">*&nbsp;</Typography>설명</Typography>
                  <BbsCKEditor
                    content={inputData}
                    className="nConEditStyle"
                    sx={{ height: '100px', width: '100%' }}
                    onContentChange={(content) => updateInput(content ?? '')}
                  />
                </Stack>
              {/* 설문조사 1개 영역 : s */}
              <Box className="nQuizBox">
                <Stack className="nConSectionDiv">
                  <Typography className="nConSectionTitle"><Typography component="span" className="required">*&nbsp;</Typography>설문 1</Typography>
                  <BbsCKEditor
                    content={inputData}
                    className="nConEditStyle"
                    sx={{ height: '60px', width: '100%' }}
                    onContentChange={(content) => updateInput(content ?? '')}
                  />
                </Stack>
                <Stack className="nConSectionDiv" sx={{ alignItems: 'flex-start' }}>
                  <Typography className="nConSectionTitle" sx={{ paddingTop: 1 }}><Typography component="span" className="required">*&nbsp;</Typography>답변 유형</Typography>
                  <List className="nSurveySetGroup">
                    <ListItem className="nSurveySet">
                      <Select defaultValue={1}>
                        <MenuItem value={1}>선택하세요</MenuItem>
                        <MenuItem value={2}>객관식</MenuItem>
                        <MenuItem value={3}>주관식</MenuItem>
                      </Select>
                    </ListItem>
                    <ListItem className="nSurveySet">
                      <Typography component="span" sx={{ marginRight: 1 }}>가로/세로 구분</Typography>
                      <Select defaultValue={1}>
                        <MenuItem value={1}>선택하세요</MenuItem>
                        <MenuItem value={2}>가로형</MenuItem>
                        <MenuItem value={3}>세로형</MenuItem>
                      </Select>
                    </ListItem>
                    <ListItem className="nSurveySet">
                      <Typography component="span">답변 선택 개수</Typography>
                      <Select defaultValue={1} sx={{ marginX: 1 }}>
                        <MenuItem value={1}>선택하세요</MenuItem>
                        <MenuItem value={2}>1개 선택</MenuItem>
                        <MenuItem value={3}>복수 선택</MenuItem>
                      </Select>
                      <TextField placeholder="" sx={{ width: 40, textAlign: 'center' }} />
                      <Typography component="span" sx={{ marginLeft: 1 }}>개 선택</Typography>
                    </ListItem>
                  </List>
                </Stack>
                <Stack className="nConSectionDiv">
                  <Typography className="nConSectionTitle"><Typography component="span" className="required">*&nbsp;</Typography>답변 항목</Typography>
                  <Stack className="nConAnswerDiv">
                    <List className="nAnswerGroup nSurvey">
                      <ListItem className="nAnswer">
                        <TextField placeholder="" sx={{ width: '100%' }} />
                        <IconButton className="nQuizBtn">
                          <Remove />
                        </IconButton>
                      </ListItem>
                      <ListItem className="nAnswer">
                        <TextField placeholder="" sx={{ width: '100%' }} />
                        <IconButton className="nQuizBtn">
                          <Remove />
                        </IconButton>
                      </ListItem>
                      <ListItem className="nAnswer">
                        <TextField placeholder="" sx={{ width: '100%' }} />
                        <IconButton className="nQuizBtn">
                          <Remove />
                        </IconButton>
                      </ListItem>
                      <ListItem className="nAnswer">
                        <TextField placeholder="" sx={{ width: '100%' }} />
                        <IconButton className="nQuizBtn">
                          <Remove />
                        </IconButton>
                      </ListItem>
                      <ListItem className="nAnswer">
                        <TextField placeholder="" sx={{ width: '100%' }} />
                        <IconButton className="nQuizBtn">
                          <Remove />
                        </IconButton>
                      </ListItem>
                    </List>
                    <Box className="nQuizBtnGroup">
                      <IconButton className="nQuizBtn">
                        <Add />
                      </IconButton>
                    </Box>
                  </Stack>
                </Stack>
              </Box>
              {/* 설문조사 1개 영역 : e */}
              <Box className="nQuizBox">
                <Stack className="nConSectionDiv">
                  <Typography className="nConSectionTitle"><Typography component="span" className="required">*&nbsp;</Typography>설문 2</Typography>
                  <BbsCKEditor
                    content={inputData}
                    className="nConEditStyle"
                    sx={{ height: '60px', width: '100%' }}
                    onContentChange={(content) => updateInput(content ?? '')}
                  />
                </Stack>
                <Stack className="nConSectionDiv" sx={{ alignItems: 'flex-start' }}>
                  <Typography className="nConSectionTitle" sx={{ paddingTop: 1 }}><Typography component="span" className="required">*&nbsp;</Typography>답변 유형</Typography>
                  <List className="nSurveySetGroup">
                    <ListItem className="nSurveySet">
                      <Select defaultValue={1}>
                        <MenuItem value={1}>선택하세요</MenuItem>
                        <MenuItem value={2}>객관식</MenuItem>
                        <MenuItem value={3}>주관식</MenuItem>
                      </Select>
                    </ListItem>
                    <ListItem className="nSurveySet">
                      <Typography component="span" sx={{ marginRight: 1 }}>가로/세로 구분</Typography>
                      <Select defaultValue={1}>
                        <MenuItem value={1}>선택하세요</MenuItem>
                        <MenuItem value={2}>가로형</MenuItem>
                        <MenuItem value={3}>세로형</MenuItem>
                      </Select>
                    </ListItem>
                    <ListItem className="nSurveySet">
                      <Typography component="span">답변 선택 개수</Typography>
                      <Select defaultValue={1} sx={{ marginX: 1 }}>
                        <MenuItem value={1}>선택하세요</MenuItem>
                        <MenuItem value={2}>1개 선택</MenuItem>
                        <MenuItem value={3}>복수 선택</MenuItem>
                      </Select>
                      <TextField placeholder="" sx={{ width: 40, textAlign: 'center' }} />
                      <Typography component="span" sx={{ marginLeft: 1 }}>개 선택</Typography>
                    </ListItem>
                  </List>
                </Stack>
                <Stack className="nConSectionDiv">
                  <Typography className="nConSectionTitle"><Typography component="span" className="required">*&nbsp;</Typography>답변 항목</Typography>
                  <Stack className="nConAnswerDiv">
                    <List className="nAnswerGroup nSurvey">
                      <ListItem className="nAnswer">
                        <TextField placeholder="" sx={{ width: '100%' }} />
                        <IconButton className="nQuizBtn">
                          <Remove />
                        </IconButton>
                      </ListItem>
                      <ListItem className="nAnswer">
                        <TextField placeholder="" sx={{ width: '100%' }} />
                        <IconButton className="nQuizBtn">
                          <Remove />
                        </IconButton>
                      </ListItem>
                      <ListItem className="nAnswer">
                        <TextField placeholder="" sx={{ width: '100%' }} />
                        <IconButton className="nQuizBtn">
                          <Remove />
                        </IconButton>
                      </ListItem>
                      <ListItem className="nAnswer">
                        <TextField placeholder="" sx={{ width: '100%' }} />
                        <IconButton className="nQuizBtn">
                          <Remove />
                        </IconButton>
                      </ListItem>
                      <ListItem className="nAnswer">
                        <TextField placeholder="" sx={{ width: '100%' }} />
                        <IconButton className="nQuizBtn">
                          <Remove />
                        </IconButton>
                      </ListItem>
                    </List>
                    <Box className="nQuizBtnGroup">
                      <IconButton className="nQuizBtn">
                        <Add />
                      </IconButton>
                    </Box>
                  </Stack>
                </Stack>
              </Box>
              <Box className="nQuizBtnGroup" sx={{ marginTop: 1 }}>
                <Button variant="contained">설문추가</Button>
              </Box>
              {/* 설문조사 컨텐츠일 경우 : e */}
            </Box>
            {/* nResultBox mid : e */}
            {/* nResultBox right : s */}
            <Box className="nDevider">
              <Box component="h4" className="nConTitle">미리보기</Box>
            </Box>
            {/* nResultBox right : e */}
          </Box>
          {/* nResultArea : e */}
          <Box className="nBtnWrap">
            <Button variant="contained">저장</Button>
            <Button variant="contained" className="nWhiteBtn">취소</Button>
          </Box>
        </Box>
        {/* nContent : e */}
      </Box>
      {/* nContainer : e */}
    </ThemeProvider>
  );
}
