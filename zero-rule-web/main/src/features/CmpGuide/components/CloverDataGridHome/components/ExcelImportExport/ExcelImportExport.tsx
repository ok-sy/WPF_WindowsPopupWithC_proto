import { csvFileToArray, readExcelAsCsv } from '@/lib/excel-csv-array';

import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CloseIcon from '@mui/icons-material/Close';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import {
  Box,
  Button,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useRef, useState } from 'react';
import type { EXCEL_GRID } from '../../grid-sample-data';
import { EXCEL_GRID_DATA } from '../../grid-sample-data';
import AddRowGrid from './components/AddRowGrid';
import { ExportToExcelWithButton } from '@/components/ExportToExcelWithButton';
import CLStyledTable from '@/components/CLStyledTable';
import CustomColoredTableHead from '@/components/CustomColoredTableHead';
import CLDocTableBody from '@/components/CLDocTableBody';
import FileDropzone from '@/components/FileDropzone';
interface AcceptedFile {
  fileName: string;
  file: File;
}

export default function ExcelImportExport() {
  const [array, setArray] = useState<EXCEL_GRID[]>([]);
  const [addArrayCnt, setAddArrayCnt] = useState<number[]>([]);

  const [acceptFile, setAcceptFile] = useState<AcceptedFile>();
  const [strCsv, setStrCsv] = useState<Promise<string>>();

  const [tableMode, setTableMode] = useState(false);

  const tableRowRef = useRef<any>(null);

  const handleDelete = () => {
    if (!acceptFile) return;
    setAcceptFile(undefined);
    setStrCsv(undefined);
    setArray([]);
    setTableMode(false);
    setAddArrayCnt([]);
  };

  // Drag & Drop 시
  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const fileList: AcceptedFile[] = acceptedFiles.map((el) => ({ fileName: el.name, file: el }));
    setAcceptFile(fileList[0]);
    const xlsxToString = readExcelAsCsv(fileList[0].file);
    setStrCsv(xlsxToString);
  };

  const handleClickDone = async (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    try {
      const csvText = await strCsv;
      const csv = csvFileToArray(csvText as string);
      const changeArr: EXCEL_GRID[] = csv.bodyRows.map((el) => ({
        expl: el[0],
        costomer: el[1],
        date: el[2],
        status: el[3],
      }));

      setArray(changeArr);
      setTableMode(true);
    } catch (err: any) {
      console.log('파일업로드를 실패하였습니다.');
      return;
    } finally {
    }
  };

  const deleteOneRow = (idx: number) => {
    if (!array) return;
    array.splice(idx, 1);

    setArray([...array]);
  };

  return (
    <Box className="ExcelImportExport-root">
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography sx={{ py: 1.5 }} variant="h5">
          EXCEL import export & EDITING GRID
        </Typography>
        <Stack direction="row" spacing={1}>
          <ExportToExcelWithButton
            variant="outlined"
            data={EXCEL_GRID_DATA}
            fileName="샘플데이터"
            btnTitle="샘플데이터"
          />
          <ExportToExcelWithButton
            data={EXCEL_GRID_DATA}
            variant="outlined"
            fileName="엑셀 업로드 양식"
            btnTitle="업로드 양식"
            isFirstRowOnly
          />
          {array && tableMode && (
            <ExportToExcelWithButton
              data={array ?? []}
              variant="outlined"
              fileName="excel-data"
              btnTitle="EXPORT EXCEL"
            />
          )}
        </Stack>
      </Stack>
      <Box p={3}>
        {acceptFile ? (
          <Stack justifyContent="center" direction="column" alignItems="center" spacing={1}>
            <Box sx={{ border: '1px solid #e0e0e0', p: 2, minWidth: 200 }}>
              <Stack
                key={acceptFile.fileName}
                alignItems="center"
                justifyContent="space-between"
                direction="row"
                maxWidth={300}
              >
                <Stack sx={{ overflow: 'hidden' }} direction="row" spacing={1}>
                  <Typography
                    color="primary"
                    sx={{
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {acceptFile.fileName}
                  </Typography>
                </Stack>
                <IconButton
                  onClick={() => {
                    handleDelete();
                  }}
                  size="small"
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Box>
            {!tableMode && (
              <Button
                sx={{ whiteSpace: 'nowrap' }}
                onClick={handleClickDone}
                color="success"
                variant="contained"
              >
                Changing Table
              </Button>
            )}
          </Stack>
        ) : (
          <FileDropzone
            acceptedExtention={['.xls', '.xlsx']}
            onAcceptedFiles={onDrop}
            disabled={false}
          />
        )}
      </Box>
      {
        <TableContainer
          sx={{
            borderRadius: 2,
            backgroundColor: '#fff',
            height: array.length === 0 ? 'auto' : 400,
            border: '1px solid #c0c0c0',
          }}
        >
          <CLStyledTable
            noMargin
            sx={{
              '& .MuiTableCell-root': {
                alignItems: 'center',
                border: '1px solid #c0c0c0',
              },
            }}
            ref={tableRowRef}
          >
            <CustomColoredTableHead>
              <TableRow
                sx={{
                  '& .MuiTableCell-root': { borderBottom: '1px solid #aaa' },
                }}
              >
                <TableCell sx={{ p: 0, textAlign: 'center' }} className="x-head">
                  <IconButton
                    onClick={async () => {
                      await setAddArrayCnt(addArrayCnt.concat(addArrayCnt.length));
                      if (tableRowRef.current) {
                        await tableRowRef.current.scrollIntoView({
                          behavior: 'smooth',
                          block: 'end',
                        });
                      }
                    }}
                    size="small"
                  >
                    <AddCircleOutlineIcon fontSize="small" />
                  </IconButton>
                </TableCell>
                <TableCell className="x-head">No</TableCell>
                <TableCell className="x-head">ID</TableCell>
                <TableCell className="x-head">Name</TableCell>
                <TableCell className="x-head">날짜</TableCell>
                <TableCell className="x-head">상태</TableCell>
              </TableRow>
            </CustomColoredTableHead>
            {array.length === 0 && (
              <TableBody sx={{ opacity: 0.8 }}>
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="h6">데이터가 존재하지 않습니다.</Typography>
                  </TableCell>
                </TableRow>
              </TableBody>
            )}
            {array.length > 1 && (
              <CLDocTableBody>
                {array.map((el, idx) => (
                  <TableRow
                    sx={{
                      '& .MuiTableCell-root': {
                        py: 1,
                      },
                    }}
                    key={el.expl}
                  >
                    <TableCell sx={{ p: 0, textAlign: 'center' }}>
                      <IconButton size="small">
                        <RemoveCircleOutlineIcon
                          onClick={() => {
                            deleteOneRow(idx);
                          }}
                          fontSize="small"
                        />
                      </IconButton>
                    </TableCell>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>{el.expl}</TableCell>
                    <TableCell>{el.costomer}</TableCell>
                    <TableCell>{el.date}</TableCell>
                    <TableCell>{el.status}</TableCell>
                  </TableRow>
                ))}
                {addArrayCnt.map((el, idx) => (
                  <AddRowGrid
                    idx={idx}
                    onSubmitRow={(row: EXCEL_GRID, addIndex: number) => {
                      if (!array) return;
                      setArray(array.concat(row));
                      const copyArr = [...addArrayCnt];
                      copyArr.splice(addIndex, 1);
                      setAddArrayCnt(copyArr);
                    }}
                    key={idx}
                  />
                ))}
              </CLDocTableBody>
            )}
          </CLStyledTable>
        </TableContainer>
      }
    </Box>
  );
}
