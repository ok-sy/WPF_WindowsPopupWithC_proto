import { BBS_CK_EDITOR_STYLES } from '@/lib/bbs-ck-editor-styles';
import { firstSx, flatSx } from '@local/ui';

export const rootSx = flatSx({
  '& .MuiDialogContent-root': {
    py: 0,
    px: 0,
  },

  '& .PdsViewDialog-dialogContent': {
    position: 'relative',
    p: 2,
  },

  '& .PdsViewDialog-title': {
    fontSize: '1rem',
    fontWeight: 500,
    textAlign: 'center',
  },

  '& .PdsViewDialog-substance': {
    fontSize: '0.85rem',
    maxWidth: '100%',
    wordBreak: 'break-all',
    minHeight: 200,
    ...firstSx(BBS_CK_EDITOR_STYLES),
  },

  '& .PdsViewDialog-attachFiles': {
    //
    '& .PdsViewDialog-attachFilesTitle': {
      fontSize: '0.8rem',
      fontWeight: 500,
      color: 'text.primary',
      ml: 2,
      mt: 2,
      mb: 1,
    },
  },

  '& .MuiDialogActions-root': {
    justifyContent: 'space-between',
  },
});
