import CustomColoredTableHead from '@/components/CustomColoredTableHead';
import CustomTableBody from '@/components/CustomTableBody';
import { useMainLayoutContext } from '@/layouts/MainLayout/MainLayoutContext';
import handleError from '@/lib/handle-error';
import { useApi } from '@/provider';
import type { ApiRequestContext } from '@local/domain';
import type { CLJob } from '@local/domain';
import {
  flatSx,
  Portlet,
  PortletContent,
  PortletHeader,
  sxTableCellNowrap,
  sxTableRowSelection,
  TitleWithReloadButton,
} from '@local/ui';
import { Table, TableCell, TableContainer, TableRow } from '@mui/material';
import clsx from 'clsx';
import { useCallback, useEffect, useState } from 'react';
import JobTableRow from './components/JobTableRow';
import errorCustomHandle from '@/lib/error-custom-handle';

export default function JobList() {
  const [lastSelectedId, setLastSelectedId] = useState<string>();
  const { sceneManager } = useMainLayoutContext();

  const api = useApi();
  const [loading, setLoading] = useState(false);
  const [jobList, setJobList] = useState<CLJob[]>([]);
  const [refreshToken, setRefreshToken] = useState(0);

  // job목록 조회
  const doReloadData = useCallback(
    async (ctx: ApiRequestContext) => {
      setLoading(true);
      try {
        const { body } = await api.clJob.list({ ctx });
        const { jobList } = body;
        if (ctx.canceled) return;
        setJobList(jobList);
      } catch (err: any) {
        // handleError(err)
        errorCustomHandle(err);
      } finally {
        setLoading(false);
      }
    },
    [api],
  );

  // api
  useEffect(() => {
    const ctx: ApiRequestContext = { canceled: false };
    doReloadData(ctx);
    return () => {
      ctx.canceled = true;
      ctx.cancel?.();
    };
  }, [refreshToken, doReloadData]);

  const updateSelectedId = (id: string) => {
    setLastSelectedId(id);
  };
  return (
    <Portlet sx={{ ml: 1, mr: 3, my: 1 }} className="JobList-root">
      <PortletHeader>
        <TitleWithReloadButton
          title="Job 목록"
          loading={loading}
          onClickRefresh={() => setRefreshToken(Date.now)}
        />
      </PortletHeader>
      <PortletContent noPadding>
        <TableContainer>
          <Table>
            <CustomColoredTableHead sx={sxTableCellNowrap}>
              <TableRow>
                <TableCell>No</TableCell>
                <TableCell>Job</TableCell>
                <TableCell>Desc</TableCell>
                <TableCell>상태</TableCell>
                <TableCell>실행</TableCell>
                <TableCell>시작 시작</TableCell>
                <TableCell>종료 시간</TableCell>
              </TableRow>
            </CustomColoredTableHead>
            <CustomTableBody loading={loading} sx={flatSx(sxTableCellNowrap, sxTableRowSelection)}>
              {jobList.map((job, idx) => (
                <JobTableRow
                  key={job.jobId}
                  seq={idx + 1}
                  job={job}
                  onClick={() => updateSelectedId(job.jobId)}
                  className={clsx({ x_selected: job.jobId === lastSelectedId })}
                />
              ))}
            </CustomTableBody>
          </Table>
        </TableContainer>
      </PortletContent>
    </Portlet>
  );
}
