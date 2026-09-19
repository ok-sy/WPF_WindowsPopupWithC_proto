import CLCodeLoader from '@/components/CLCodeLoader';
import CustomColoredTableHead from '@/components/CustomColoredTableHead';
import CustomTableBody from '@/components/CustomTableBody';
import type { TeamInfoDialogProps } from '@/dialogs/TeamInfoDialog';
import TeamInfoDialog from '@/dialogs/TeamInfoDialog';
import type { TeamInputDialogProps } from '@/dialogs/TeamInputDialog';
import TeamInputDialog from '@/dialogs/TeamInputDialog';
import handleError from '@/lib/handle-error';
import { useApi } from '@/provider';
import type { ApiRequestContext, Team } from '@local/domain';
import {
  Portlet,
  PortletContent,
  PortletHeader,
  TitleWithReloadButton,
  flatSx,
  sxTableCellNowrap,
  sxTableRowSelection,
  useElementLeftTop,
} from '@local/ui';
import type { SxProps } from '@mui/material';
import {
  Box,
  Button,
  LinearProgress,
  Stack,
  Table,
  TableCell,
  TableContainer,
  TableRow,
} from '@mui/material';
import clsx from 'clsx';
import { useCallback, useEffect, useState } from 'react';
import TeamListRow from './components/TeamListRow';
import TeamSearchBar from './components/TeamSearchBar';
import errorCustomHandle from '@/lib/error-custom-handle';

type Props = {
  sx?: SxProps;
  className?: string;
};

type DialogId = 'TeamInputDialog' | 'TeamInfoDialog';

export default function TeamListView(props: Props) {
  const { sx, className } = props;
  const api = useApi();
  const [loading, setLoading] = useState(false);
  const [dialogId, setDialogId] = useState<DialogId>();
  const [teamInputDialogProps, setTeamInputDialogProps] = useState<TeamInputDialogProps>();
  const [teamInfoDialogProps, setTeamInfoDialogProps] = useState<TeamInfoDialogProps>();
  const [bodyElement, setBodyElement] = useState<HTMLDivElement | null>(null);
  const { y: bodyTop } = useElementLeftTop(bodyElement, []);
  const [searchOption, setSearchOption] = useState<string>();
  const [refreshToken, setRefreshToken] = useState(0);
  const [teamList, setTeamList] = useState<Team[]>([]);
  const closeDialog = () => {
    setDialogId(undefined);
    setTeamInputDialogProps(undefined);
    setTeamInfoDialogProps(undefined);
  };

  // 신규 등록 다이어로그
  const newTeamHandle = () => {
    setDialogId('TeamInputDialog');
    setTeamInputDialogProps({
      open: true,
      onClose: () => {
        closeDialog();
        setRefreshToken(Date.now());
      },
    });
  };

  // 기본정보 및 수정 다이어로그
  const teamInfoDialogHandle = (teamId: number) => {
    setDialogId('TeamInfoDialog');
    setTeamInfoDialogProps({
      open: true,
      onClose: () => {
        closeDialog();
        setRefreshToken(Date.now());
      },
      teamId,
    });
  };

  const handleClickNewBtn = () => {
    newTeamHandle();
  };

  // 목록조회
  const doReload = useCallback(
    async (ctx: ApiRequestContext, keyword?: string) => {
      setLoading(true);
      try {
        const { body } = await api.team.list({
          ctx,
          teamNm: keyword ?? '',
        });
        const { teamList } = body;
        if (ctx.canceled) return;
        setTeamList(teamList);
      } catch (err) {
        // handleError(err)
        errorCustomHandle(err);
      } finally {
        setLoading(false);
      }
    },
    [api],
  );

  // 새로 불러오기
  useEffect(() => {
    const ctx = { canceled: false } as ApiRequestContext;
    doReload(ctx, searchOption);

    return () => {
      ctx.canceled = true;
      ctx.cancel?.();
    };
  }, [refreshToken, doReload, searchOption]);

  // 새로고침
  const handleClickRefresh = () => {
    setRefreshToken(Date.now());
  };

  // search box에서 검색 옵션이 변경된 경우
  const handleChangeSearchBox = (option?: string) => {
    setSearchOption(option);
  };

  const codeData = CLCodeLoader('503');
  return (
    <Box sx={sx} className={clsx('TeamListView-root', className)}>
      <TeamSearchBar onSubmit={handleChangeSearchBox} loading={loading} />
      <Portlet sx={{ position: 'relative' }}>
        <PortletHeader>
          <TitleWithReloadButton title="TEAM 목록" onClickRefresh={handleClickRefresh} />
          <Stack direction="row" spacing={2}>
            <Button color="success" onClick={handleClickNewBtn}>
              신규
            </Button>
          </Stack>
        </PortletHeader>
        <PortletContent noPadding>
          <TableContainer
            ref={setBodyElement}
            sx={{
              height: {
                xs: 'auto',
                md: `calc(100vh - ${bodyTop}px - 50px)`,
              },
            }}
          >
            <Table>
              <CustomColoredTableHead>
                <TableRow>
                  <TableCell>팀 ID</TableCell>
                  <TableCell>팀명</TableCell>
                  <TableCell>팀 설명</TableCell>
                  <TableCell>팀 업무</TableCell>
                  <TableCell>인원</TableCell>
                </TableRow>
              </CustomColoredTableHead>
              <CustomTableBody stripe sx={flatSx(sxTableCellNowrap, sxTableRowSelection)}>
                {teamList.map((el) => {
                  const teamTskClsf = codeData?.find(
                    (code) => code.code === String(el.teamTskClsf),
                  );
                  return (
                    <TeamListRow
                      key={el.teamId}
                      data={el} //
                      teamTskClsfData={teamTskClsf?.codeNm ?? ''}
                      onClickRow={teamInfoDialogHandle}
                    />
                  );
                })}
              </CustomTableBody>
            </Table>
          </TableContainer>
        </PortletContent>
        {loading && (
          <Box sx={{ position: 'absolute', top: 0, width: '100%' }}>
            <LinearProgress />
          </Box>
        )}
      </Portlet>
      {dialogId === 'TeamInputDialog' && teamInputDialogProps && (
        <TeamInputDialog {...teamInputDialogProps} />
      )}
      {dialogId === 'TeamInfoDialog' && teamInfoDialogProps && (
        <TeamInfoDialog {...teamInfoDialogProps} />
      )}
    </Box>
  );
}
