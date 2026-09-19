import * as XLSX from 'xlsx';

export const csvFileToArray = (str: string): { header: string[]; bodyRows: string[][] } => {
  const [firstLine, ...bodyLines] = str.split('\n');
  const header: string[] = firstLine.split(',');
  const bodyRows: string[][] = bodyLines.map((line) => line.split(','));
  return { header, bodyRows };
};

export const readExcelAsCsv = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const rABS = !!reader.readAsBinaryString;
    reader.onload = (e: ProgressEvent<FileReader>) => {
      if (e.target === null) {
        reject(new Error('error'));
        return;
      }
      const bstr = e.target.result;
      const wb = XLSX.read(bstr, { type: rABS ? 'binary' : 'array', bookVBA: true });
      const firstSheetName = wb.SheetNames[0];
      const firstSheet = wb.Sheets[firstSheetName];
      const csv = XLSX.utils.sheet_to_csv(firstSheet, {
        rawNumbers: true,
        blankrows: false,
        strip: true,
      });
      resolve(csv);
    };
    if (rABS) {
      reader.readAsBinaryString(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  });
};
