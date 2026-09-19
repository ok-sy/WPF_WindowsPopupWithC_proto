import { Portlet } from '@local/ui';
import {
  Box,
  Button,
  Stack,
  TextField,
  Typography,
  Table,
  TableBody,
  TableRow,
  TableCell,
} from '@mui/material';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { rootSx } from './style';

interface State {
  password: string;
  showPassword: boolean;
}
export default function ManagerSignUp() {
  const [password, setPassword] = useState('');
  const [passwordCheck, setPasswordCheck] = useState('');
  const router = useRouter();
  const handleClickLink = (href: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    router.push(href);
  };

  const passwordChangeHandle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const passwordCheckHandle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordCheck(e.target.value);
  };
  return (
    <Box className="ManagerSignUp-root" sx={rootSx}>
      <Portlet sx={{ px: 10, py: 5 }}>
        <Box flexDirection="column" display="flex" justifyContent="center" alignItems="center">
          <Typography sx={{ mb: 3 }} className="ManagerSignUp-title" variant="h4">
            회원가입
          </Typography>
        </Box>
        <Table>
          <TableBody>
            <TableRow>
              <TableCell className="ManagerSignUp-tableNameMin">아이디</TableCell>
              <TableCell className="ManagerSignUp-tableInput">
                <TextField size="small" placeholder="아이디 입력" />
                <Button
                  variant="outlined"
                  sx={{
                    ml: 1,
                    color: '#333333',
                    borderColor: '#333333',
                    '&:hover': { borderColor: 'black' },
                  }}
                >
                  중복확인
                </Button>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="ManagerSignUp-tableNameMin">비밀번호</TableCell>
              <TableCell className="ManagerSignUp-tableInput">
                <TextField
                  onChange={passwordChangeHandle}
                  type={'password'}
                  className="ManagerSignUp-text"
                  size="small"
                  placeholder="비밀번호 입력"
                />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="ManagerSignUp-tableNameMin"></TableCell>
              <TableCell className="ManagerSignUp-tableInput">
                <TextField
                  onChange={passwordCheckHandle}
                  type={'password'}
                  className="ManagerSignUp-text"
                  size="small"
                  placeholder="비밀번호 확인"
                  error={password !== passwordCheck}
                  helperText={
                    passwordCheck === ''
                      ? ''
                      : password === passwordCheck
                        ? '비밀번호가 같습니다'
                        : '비밀번호가 일치하지 않습니다'
                  }
                />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="ManagerSignUp-tableNameMin">이름</TableCell>
              <TableCell className="ManagerSignUp-tableInput">
                <TextField
                  className="ManagerSignUp-text"
                  size="small"
                  placeholder="실명을 입력하세요"
                />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="ManagerSignUp-tableNameMin">이메일</TableCell>
              <TableCell className="ManagerSignUp-tableInput">
                <TextField
                  className="ManagerSignUp-text"
                  size="small"
                  placeholder="이메일 입력하세요"
                />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="ManagerSignUp-tableNameMin">휴대폰 번호</TableCell>
              <TableCell className="ManagerSignUp-tableInput">
                <TextField size="small" placeholder={`" - " 구분없이 입력`} />
                <Button
                  variant="outlined"
                  sx={{
                    ml: 1,
                    color: '#333333',
                    borderColor: '#333333',
                    '&:hover': { borderColor: 'black' },
                  }}
                >
                  인증요청
                </Button>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="ManagerSignUp-tableNameMin">인증번호 입력</TableCell>
              <TableCell className="ManagerSignUp-tableInput">
                <TextField
                  className="ManagerSignUp-text"
                  size="small"
                  placeholder="인증번호를 입력하세요"
                />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Button
            variant="outlined"
            sx={{ color: '#333333', borderColor: '#333333', '&:hover': { borderColor: 'black' } }}
            onClick={handleClickLink('/login')}
          >
            이전
          </Button>
          <Button
            variant="contained"
            sx={{ ml: 1, backgroundColor: '#333333', '&:hover': { backgroundColor: 'black' } }}
          >
            가입하기
          </Button>
        </Box>
      </Portlet>
    </Box>
  );
}
