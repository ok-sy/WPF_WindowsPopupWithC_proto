import CLStyledTableCheckBox from '@/components/CLStyledTableCheckBox';
import TextOverField from '@/components/TextOverField';
import { mgmtInfoRowSx } from '@/features/InterfaceMgmtHome/style';
import { TableCell, TableRow } from '@mui/material';
import type { InterfaceVo } from '@local/domain';
import clsx from 'clsx';

type Props = {
  data: InterfaceVo;
  onSubmitDoubleClick: (ifid: string) => void;
  onSubmitClick: (data: InterfaceVo) => void;
  selected: boolean;
  checked: string[];
  checkHandle: (value: string, checked: boolean) => void;
};
export default function InterfaceInfoRow(props: Props) {
  const { data, onSubmitDoubleClick, onSubmitClick, selected, checked, checkHandle } = props;
  const {
    characterset,
    docLength,
    eaiid,
    ifConnectionTypeCd,
    ifDesc,
    ifNm,
    ifProcessTypeCd,
    ifid,
    ruleUseYn,
    updateDatetime,
    updateUserid,
  } = data;
  return (
    <TableRow
      className={clsx('InterfaceInfoRow-root', {
        x_selected: selected,
      })}
      onClick={() => onSubmitClick(data)}
      onDoubleClick={() => onSubmitDoubleClick(ifid)}
      sx={mgmtInfoRowSx}
    >
      <TableCell>
        <CLStyledTableCheckBox
          onChange={(e, checked) => {
            checkHandle(ifid, checked);
          }}
          checked={checked.includes(ifid)}
        />
      </TableCell>
      {/* 인터페이스ID */}
      <TableCell>{ifid}</TableCell>
      {/* 인터페이스명 */}
      <TableCell>
        <TextOverField text={ifNm} maxWidth={230} fontSize="0.75rem" />
      </TableCell>
      {/* 인터페이스설명 */}
      <TableCell>
        <TextOverField text={ifDesc} maxWidth={275} fontSize="0.75rem" />
      </TableCell>
      {/* 처리유형 */}
      <TableCell>{ifProcessTypeCd}</TableCell>
      {/* 연계방식 */}
      <TableCell>{ifConnectionTypeCd}</TableCell>
      {/* RULE사용여부 */}
      <TableCell>{ruleUseYn}</TableCell>
      {/* 전문길이수 */}
      <TableCell>{docLength}</TableCell>
      {/* 캐릭터셋 */}
      <TableCell>{characterset}</TableCell>
      {/* EAIID */}
      <TableCell>{eaiid}</TableCell>
      {/* 변경사용자ID */}
      <TableCell>{updateUserid}</TableCell>
      {/* 변경일시 */}
      <TableCell>{updateDatetime}</TableCell>
    </TableRow>
  );
}
