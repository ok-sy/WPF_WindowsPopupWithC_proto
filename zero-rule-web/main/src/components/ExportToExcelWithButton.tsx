import type { ButtonProps } from '@mui/material';
import { Button } from '@mui/material';
import * as xlsx from 'xlsx-js-style';
/**
 *
 * @param param0 data props의 값을 받아 엑셀로 자동 변환 (head의 값은 json 객체 키값)
 * @returns
 * @author sim jin woo
 */
export const ExportToExcelWithButton: React.FC<
  {
    data: any[];
    fileName: string;
    btnTitle: string;
    isFirstRowOnly?: boolean;
  } & ButtonProps
> = ({ data, fileName, btnTitle, isFirstRowOnly, ...restProps }) => {
  const exportToExcelWithFormatting = () => {
    const ws = xlsx.utils.json_to_sheet(data);

    ws['!cols'] = [
      { wpx: 100 },
      { wpx: 100 },
      { wpx: 100 },
      { wpx: 100 },
      { wpx: 100 },
      { wpx: 100 },
      { wpx: 100 },
      { wpx: 100 },
      { wpx: 100 },
      { wpx: 100 },
      { wpx: 100 },
      { wpx: 100 },
      { wpx: 100 },
      { wpx: 100 },
      { wpx: 100 },
      { wpx: 100 },
      { wpx: 100 },
      { wpx: 100 },
      { wpx: 100 },
      { wpx: 100 },
      { wpx: 100 },
      { wpx: 100 },
      { wpx: 100 },
    ];
    // 예제로 첫 번째 행에 배경색과 글자색을 적용
    const firstRow = 0;

    for (let col = 0; col < 12; col++) {
      const cellAddress = xlsx.utils.encode_cell({ r: firstRow, c: col });

      // Check if the cell exists before modifying it
      if (ws[cellAddress]) {
        const cell = ws[cellAddress];

        // Apply styles to each cell in the first row
        Object.assign(cell, {
          s: {
            fill: { bgColor: { indexed: 64 }, fgColor: { rgb: 'e9ec69' } },
            font: { color: { rgb: '000000' }, bold: true, size: 30 },
            border: {
              top: { style: 'thin', color: { rgb: '000000' } },
              right: { style: 'thin', color: { rgb: '000000' } },
              bottom: { style: 'thin', color: { rgb: '000000' } },
              left: { style: 'thin', color: { rgb: '000000' } },
            },
          },
        });
      }
    }

    if (isFirstRowOnly) {
      // // 특정 행만 남기고 나머지 행 제거
      const range = xlsx.utils.decode_range(ws['!ref'] ?? '');
      const newRange = { s: { r: 0, c: 0 }, e: { r: 0, c: range.e.c } };
      ws['!ref'] = xlsx.utils.encode_range(newRange);
    }

    // 엑셀 파일 생성
    const wb: xlsx.WorkBook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Sheet1');

    // 엑셀 파일 다운로드
    xlsx.writeFile(wb, `${fileName}.xlsx`);
  };

  return (
    <Button {...restProps} onClick={exportToExcelWithFormatting}>
      {btnTitle}
    </Button>
  );
};
