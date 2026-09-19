import type { SxProps } from '@mui/material';
/**
 * InterfaceMgmtHome-root
 */
export const rootSx: SxProps = {
  py: 1,
  pl: 1,
  pr: 3,
  '& .loading-box': { position: 'absolute', top: 0, width: '100%' },
  '& .tab-content': {
    border: '1px solid #e0e0e0',
    p: 1,
  },
};

/**
 * InterfaceMgmt-root
 */
export const mgmtSx: SxProps = {
  '& .table-container': {
    mt: 1,
    minHeight: 350,
    border: '1px solid #e0e0e0',
    '& .table-head': { '& .MuiTableCell-root': { textAlign: 'center' } },

    '& .MuiTableCell-root': {
      whiteSpace: 'nowrap',
      borderLeft: '1px solid #e0e0e0',
      px: 1,
      ':nth-of-type(1)': {
        width: 35,
        minWidth: 35,
        maxWidth: 35,
        textAlign: 'center',
      },
      ':nth-of-type(2)': {
        width: 110,
        minWidth: 110,
        maxWidth: 110,
      },
      ':nth-of-type(3)': {
        width: 230,
        minWidth: 230,
        maxWidth: 230,
      },
      ':nth-of-type(4)': {
        width: 230,
        minWidth: 230,
        maxWidth: 230,
      },
      ':nth-of-type(5)': {
        width: 90,
        minWidth: 90,
        maxWidth: 90,
      },
      ':nth-of-type(6)': {
        width: 90,
        minWidth: 90,
        maxWidth: 90,
      },
      ':nth-of-type(7)': {
        width: 110,
        minWidth: 110,
        maxWidth: 110,
        textAlign: 'center',
      },
      ':nth-of-type(8)': {
        width: 100,
        minWidth: 100,
        maxWidth: 100,
      },
      ':nth-of-type(9)': {
        width: 100,
        minWidth: 100,
        maxWidth: 100,
      },
      ':nth-of-type(10)': {
        width: 100,
        minWidth: 100,
        maxWidth: 100,
      },
      ':nth-of-type(11)': {
        width: 100,
        minWidth: 100,
        maxWidth: 100,
      },
      ':nth-of-type(12)': {
        width: 140,
        minWidth: 140,
        maxWidth: 140,
      },
    },
  },
};

/**
 * InterfaceInfoRow-root
 */
export const mgmtInfoRowSx: SxProps = {
  cursor: 'pointer',
};

/**
 * InterfaceMapMgmt-root
 */
export const mgmtMapSx: SxProps = {
  '& .mgmt-map-list': { mb: 2 },
  '& .loading-box': { position: 'absolute', top: 0, width: '100%' },
  '& .table-head': { '& .MuiTableCell-root': { textAlign: 'center' } },
  '& .table-container': {
    whiteSpace: 'nowrap',
    mt: 1,
    border: '1px solid #e0e0e0',
    minHeight: 350,
    '& .MuiTableCell-root': {
      borderLeft: '1px solid #e0e0e0',
      px: 1,
      ':nth-of-type(1)': {
        width: 35,
        minWidth: 35,
        maxWidth: 35,
        textAlign: 'center',
      },

      ':nth-of-type(2)': {
        width: 80,
        minWidth: 80,
        maxWidth: 80,
      },
      ':nth-of-type(3)': {
        width: 230,
        minWidth: 230,
        maxWidth: 230,
      },
      ':nth-of-type(4)': {
        width: 230,
        minWidth: 230,
        maxWidth: 230,
      },
      ':nth-of-type(5)': {
        width: 70,
        minWidth: 70,
        maxWidth: 70,
      },
      ':nth-of-type(6)': {
        width: 70,
        minWidth: 70,
        maxWidth: 70,
      },
      ':nth-of-type(7)': {
        width: 100,
        minWidth: 100,
        maxWidth: 100,
      },
      ':nth-of-type(8)': {
        width: 100,
        minWidth: 100,
        maxWidth: 100,
      },
      ':nth-of-type(9)': {
        width: 100,
        minWidth: 100,
        maxWidth: 100,
      },
      ':nth-of-type(10)': {
        width: 120,
        minWidth: 120,
        maxWidth: 120,
      },
      ':nth-of-type(11)': {
        width: 90,
        minWidth: 90,
        maxWidth: 90,
      },
      ':nth-of-type(12)': {
        width: 90,
        minWidth: 90,
        maxWidth: 90,
      },
    },
  },
};
