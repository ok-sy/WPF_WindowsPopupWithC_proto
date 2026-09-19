import type { SxProps } from '@mui/material';

export const BBS_CK_EDITOR_STYLES: SxProps = {
  wordBreak: 'break-all',
  lineHeight: 1.5,
  letterSpacing: 0.5,
  margin: '0.5em 0 0 0',
  fontSize: '1rem',
  // fontFamily: "'Noto Sans KR', Georgia, sans-serif, serif",

  '& figure': { m: 0 },
  '& p': { fontSize: '0.95rem' },

  '& img': { maxWidth: '100%', height: 'auto!important' },

  '& table': {
    width: '100%',
    border: '1px solid #ddd',
    borderCollapse: 'collapse',
    '& th': { backgroundColor: '#eee' },
    '& td,& th': { textAlign: 'left', border: '1px solid #ddd', p: 1 },
  },
  '& ul,& ol': { mx: '1rem', '& li': { lineHeight: 1.3, mt: 0.5 }, '& ul, & ol': { mx: 0, pl: 3 } },
  '& pre, & code': { fontFamily: "'Nanum Gothic Coding','Noto Sans KR', monospace" },
  '& pre': {
    fontSize: '0.9rem',
    px: 2,
    py: 1.5,
    borderRadius: 1,
    border: '1px solid #ddd',
    backgroundColor: '#eee',
    whiteSpace: 'pre-wrap',
  },
};
