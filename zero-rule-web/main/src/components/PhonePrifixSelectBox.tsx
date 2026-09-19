import type { SelectChangeEvent } from '@mui/material';
import { Box, MenuItem, Select } from '@mui/material';
import clsx from 'clsx';
import { useState } from 'react';

type Props = {
  defaultValue?: string;
  onSubmit: (selectVal: string) => void;
  className?: string;
};
/**
 * 전화번호 셀렉트 박스
 */
const tellPriArr = ['010', '011', '012'];
export default function PhonePrifixSelectBox(props: Props) {
  const { defaultValue, onSubmit, className } = props;
  const [selectVal, setSelectVal] = useState(defaultValue);
  const handleChange = (event: SelectChangeEvent) => {
    setSelectVal(event.target.value as string);
    onSubmit(event.target.value as string);
  };

  return (
    <Box className={clsx('PhonePrifixSelectBox-root', className)}>
      <Select sx={{ borderRadius: 0 }} size="small" value={selectVal} onChange={handleChange}>
        {tellPriArr.map((el) => (
          <MenuItem key={el} value={el}>
            {el}
          </MenuItem>
        ))}
      </Select>
    </Box>
  );
}
