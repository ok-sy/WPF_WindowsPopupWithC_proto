import TextOverField from '@/components/TextOverField';
import { TableCell, TableRow, Typography } from '@mui/material';
import type { EmailTransInfo } from '@local/domain';
import { useEffect, useRef, useState } from 'react';
import { infoRowSx } from '../styls';

type Props = {
  data: EmailTransInfo;
  refData: (node: HTMLTableRowElement | null) => void;
};
export default function EmailTransInfoRow(props: Props) {
  const { data, refData } = props;
  const {
    emailTracsceiveDatetime,
    emailTransceiveTypeCd,
    empId,
    opponentEmailDomainAddr,
    fileAttachYn,
    fileAttachSize,
    emailTitle,
    departmentCd,
    inspectionYn,
    callRuleResult,
  } = data;

  const emailTitleCellRef = useRef<HTMLTableCellElement>(null);
  const [emailTitleMaxWidth, setEmailTitleMaxWidth] = useState<number>(260);
  const opponentEmailDomainAddrCellRef = useRef<HTMLTableCellElement>(null);
  const [opponentEmailDomainAddrMaxWidth, setOpponentEmailDomainAddrMaxWidth] =
    useState<number>(200);
  const departmentCdCellRef = useRef<HTMLTableCellElement>(null);
  const [departmentCdMaxWidth, setDepartmentCdMaxWidth] = useState<number>(130);
  useEffect(() => {
    if (emailTitleCellRef.current) {
      const cellWidth = emailTitleCellRef.current.offsetWidth + 20;
      setEmailTitleMaxWidth(cellWidth);
    }
  }, [emailTitleCellRef, data]);
  useEffect(() => {
    if (opponentEmailDomainAddrCellRef.current) {
      const cellWidth = opponentEmailDomainAddrCellRef.current.offsetWidth + 20;
      setOpponentEmailDomainAddrMaxWidth(cellWidth);
    }
  }, [opponentEmailDomainAddrCellRef, data]);
  useEffect(() => {
    if (departmentCdCellRef.current) {
      const cellWidth = departmentCdCellRef.current.offsetWidth + 20;
      setDepartmentCdMaxWidth(cellWidth);
    }
  }, [departmentCdCellRef, data]);
  return (
    <TableRow sx={infoRowSx} ref={refData}>
      {/* 송수신코드 */}
      <TableCell>
        <Typography textAlign="center">{emailTransceiveTypeCd}</Typography>
      </TableCell>
      {/* 이메일송수신시간 */}
      <TableCell>
        <Typography textAlign="center">{emailTracsceiveDatetime}</Typography>
      </TableCell>
      {/* ID */}
      <TableCell>
        <Typography textAlign="center">{empId}</Typography>
      </TableCell>
      {/* 부서명 */}
      <TableCell ref={departmentCdCellRef}>
        <TextOverField text={departmentCd} maxWidth={departmentCdMaxWidth} fontSize="0.75rem" />
      </TableCell>
      {/* 대상이메일도메인 */}
      <TableCell ref={opponentEmailDomainAddrCellRef}>
        <TextOverField
          text={opponentEmailDomainAddr}
          maxWidth={opponentEmailDomainAddrMaxWidth}
          fontSize="0.75rem"
        />
      </TableCell>
      {/* 메일제목 */}
      <TableCell ref={emailTitleCellRef}>
        <TextOverField text={emailTitle} maxWidth={emailTitleMaxWidth} fontSize="0.75rem" />
      </TableCell>
      {/* 첨부파일여부 */}
      <TableCell>
        <Typography textAlign="center">{fileAttachYn}</Typography>
      </TableCell>
      {/* 첨부파일용량 */}
      <TableCell>
        <Typography textAlign="right">{fileAttachSize + ' kb'}</Typography>
      </TableCell>
      {/* 점검결과 */}
      <TableCell>
        <Typography textAlign="center">{inspectionYn}</Typography>
      </TableCell>
      {/* 룰호출결과 */}
      <TableCell>
        <Typography textAlign="left">{callRuleResult ?? '-'}</Typography>
      </TableCell>
    </TableRow>
  );
}
