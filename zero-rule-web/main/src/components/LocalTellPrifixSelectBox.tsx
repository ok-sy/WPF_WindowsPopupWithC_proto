import type { SelectChangeEvent } from '@mui/material';
import { Box, MenuItem, Select } from '@mui/material';
import clsx from 'clsx';
import { useState } from 'react';

type Props = {
  className?: string;
  defaultValue?: string;
  onSubmit: (selectVal: string) => void;
};
/**
 *지역번호 셀렉트 박스
 */
const tellPriArr = ['02', '031', '011'];
export default function LocalTellPrifixSelectBox(props: Props) {
  const { defaultValue, onSubmit, className } = props;
  const [selectVal, setSelectVal] = useState(defaultValue);
  const handleChange = (event: SelectChangeEvent) => {
    setSelectVal(event.target.value as string);
    onSubmit(event.target.value as string);
  };

  return (
    <Box className={clsx('LocalTellPrifixSelectBox-root', className)}>
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
