import type { CLJob } from '@local/domain';
import { Portlet, PortletContent, sxTableRowSelection } from '@local/ui';
import { Table, TableBody, TableCell, TableContainer, TableRow, Typography } from '@mui/material';
import clsx from 'clsx';
import SideJobRow from './SideJobRow';

type Props = {
  jobList: CLJob[];
  onSelected: (jobId: string | undefined) => void;
  selectedJobId?: string;
};

export default function SideJobList(props: Props) {
  const { jobList, onSelected, selectedJobId } = props;

  return (
    <Portlet className="SideJobList-root">
      <PortletContent noPadding>
        <TableContainer>
          <Table>
            <TableBody sx={sxTableRowSelection}>
              <TableRow
                hover
                onClick={() => onSelected(undefined)}
                className={!selectedJobId ? 'x_selected' : undefined}
              >
                <TableCell>
                  <Typography variant="body2" color={!selectedJobId ? 'primary' : 'inherit'}>
                    전체
                  </Typography>
                </TableCell>
              </TableRow>
              {jobList?.map((jobConfig) => (
                <SideJobRow
                  key={jobConfig.jobId}
                  job={jobConfig}
                  onSelected={onSelected}
                  className={clsx({
                    x_selected: jobConfig.jobId === selectedJobId,
                  })}
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </PortletContent>
    </Portlet>
  );
}
