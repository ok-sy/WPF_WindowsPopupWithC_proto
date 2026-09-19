import type { NavSectionEditDialogProps } from '@/dialogs/NavSectionEditDialog';
import NavSectionEditDialog from '@/dialogs/NavSectionEditDialog';
import handleError from '@/lib/handle-error';
import { useApi } from '@/provider';
import type { CLNavPage, CLNavSection } from '@local/domain';
import { useElementLeftTop } from '@local/ui';
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import CreateNewFolderOutlinedIcon from '@mui/icons-material/CreateNewFolderOutlined';
import HelpIcon from '@mui/icons-material/Help';
import type { SxProps, Theme } from '@mui/material';
import { Box, Button, IconButton, LinearProgress, Stack, Tooltip, Typography } from '@mui/material';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import HelpPaper from './components/HelpPaper';
import PageSelectList from './components/PageSelectList';
import SortableTreeBox from './components/SortableTreeBox';
import { MenuEditManager } from './MenuEditManager';
import type { PageListItemInfo, SortedItems } from './types';
import { useTreeDataLoad } from './useTreeDataLoad';
import errorCustomHandle from '@/lib/error-custom-handle';

export const rootSx: SxProps<Theme> = {
  overflow: 'auto',
  px: 2.5,
  py: 1.5,
};

type Props = {
  navId: number;
  onEditMode: () => void;
};
type DialogId = 'NavSectionEditDialog';
export default function MenuEdit(props: Props) {
  const { navId, onEditMode } = props;
  const api = useApi();

  const menuEditMgr = useMemo(() => new MenuEditManager(), []);
  const [bodyElement, setBodyElement] = useState<HTMLDivElement | null>(null);
  const { y: bodyTop } = useElementLeftTop(bodyElement, []);
  const [refreshToken, setRefreshToken] = useState(0);
  const [dialogId, setDialogId] = useState<DialogId>();
  const [navSectionEditDialogProps, setNavSectionEditDialogProps] =
    useState<NavSectionEditDialogProps>();

  const [helpText, setHelpText] = useState(false);

  const { loading, nav, navItems, pageList, onVisableChange } = useTreeDataLoad(
    navId,
    refreshToken,
  );

  // 다이얼로그 닫기
  const closeDialog = () => {
    setDialogId(undefined);
    setNavSectionEditDialogProps(undefined);
  };
  //수정
  const openSectionEdit = useRef((sectionId: number | undefined) => {
    setDialogId('NavSectionEditDialog');

    setNavSectionEditDialogProps({
      open: true,
      onClose: closeDialog,
      sectionId,
      navId,
      onSaved: (savedSection) => {
        const pageSectionToNavSection: CLNavSection = {
          itemType: 'SECTION',
          subitems: [],
          ...savedSection,
        };
        menuEditMgr.addSection(pageSectionToNavSection);
        closeDialog();
      },
      onDel: (sectionId) => {
        menuEditMgr.deleteSection(sectionId);
      },
    });
  });

  // 섹션 추가 다이얼로그
  const handleClickSectionInsert = () => {
    openSectionEdit.current(undefined);
  };

  // 페이지 추가
  const handleClickPage = (pageInfo: PageListItemInfo) => {
    if (pageInfo.visible) {
      // 이미 페이지 있음 제거
      menuEditMgr.deletePage(pageInfo.pageId);
    } else {
      // 새로 페이지 추가
      const page: CLNavPage = { ...pageInfo };
      menuEditMgr.addPage(page);
    }
    // 눈알 변경
    onVisableChange(pageInfo.pageId);
  };

  // 수정시 Input에 값 전달해주는 리셋터
  useEffect(() => {
    menuEditMgr.resetNavItems(navItems);
  }, [menuEditMgr, navItems]);

  // 저장 api 호출
  const doSave = useCallback(
    async (params: { navId: number; items: SortedItems }) => {
      try {
        await api.clNav.sortItems(params);
        return true;
      } catch (err) {
        // handleError(err)
        errorCustomHandle(err);
      } finally {
      }
      return null;
    },
    [api],
  );

  // 저장버튼 클릭
  const handleClickSaveBtn = () => {
    if (!navId) return;
    const treeData = menuEditMgr.treeItems$.value;
    if (!treeData) {
      toast.warn('no data');
      return;
    }
    // 트리데이터를 파라미터에 맞는 값으로 변경하는 로직
    const items = treeData.flatMap((item) => {
      if (item.type === 'PAGE') {
        return { pageId: item.id };
      } else if (item.type === 'SECTION') {
        const sectionId = item.id!;
        const subitems = item.children;
        if (!subitems) return [];
        if (typeof subitems === 'function') {
          console.warn('XXX unexpected subitems: 함수야? ', subitems);
          return null;
        }
        return subitems.map((subitem) => ({ pageId: subitem.id, sectionId }));
      }
      return [];
    }) as SortedItems;
    const tmpData = {
      navId: navId,
      items: items,
    };
    doSave(tmpData).then((result) => {
      if (result) {
        toast.success('저장되었습니다!');
        onEditMode();
      }
    });
  };

  useEffect(() => {
    const s1 = menuEditMgr.observeSectionClick().subscribe((sectionId) => {
      openSectionEdit.current(sectionId);
    });
    return () => {
      s1.unsubscribe();
    };
  }, [menuEditMgr]);

  return (
    <Box className="MenuEdit-root" sx={rootSx}>
      <Stack direction="row" justifyContent="space-between">
        <Tooltip arrow title="뒤로가기">
          <IconButton onClick={(_) => onEditMode()} size="small">
            <ArrowBackOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Button onClick={handleClickSaveBtn} size="small" variant="contained" color="success">
          저장
        </Button>
      </Stack>
      <Stack
        ref={setBodyElement}
        sx={{ height: `calc(100vh - ${bodyTop}px - 32px)` }}
        direction="row"
        spacing={3}
      >
        <Box flex={1}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center">
              <Typography
                sx={{
                  em: {
                    color: 'secondary.main',
                    fontStyle: 'normal',
                    mr: 0.5,
                  },
                }}
                color="GrayText"
                variant="body2"
              >
                <em>{nav?.navNm}</em>
                메뉴
              </Typography>
              <Box position="relative">
                <IconButton
                  onMouseOver={() => setHelpText(true)}
                  onMouseOut={() => setHelpText(false)}
                  sx={{ ml: 1 }}
                  size="small"
                >
                  <HelpIcon fontSize="small" />
                </IconButton>
                {helpText && <HelpPaper />}
              </Box>
            </Stack>
            <Tooltip arrow title="새 그룹 추가">
              <IconButton onClick={handleClickSectionInsert} size="small">
                <CreateNewFolderOutlinedIcon sx={{ fontSize: '1.5rem' }} />
              </IconButton>
            </Tooltip>
          </Stack>
          <Box
            sx={{
              position: 'relative',
              height: '93%',
              overflow: 'auto',
              border: '1px solid #c4c4c4',
            }}
          >
            {loading && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: 6,
                }}
              >
                <LinearProgress />
              </div>
            )}
            {nav && navItems && (
              <SortableTreeBox //
                menuEditManager={menuEditMgr}
              />
            )}
          </Box>
        </Box>

        <Stack sx={{ height: `calc(100vh - ${bodyTop}px - 100px)` }} flexBasis={'40%'}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography
              sx={{
                em: {
                  color: 'secondary.main',
                  fontStyle: 'normal',
                  mr: 0.5,
                },
                pt: 1.5,
                pb: 1,
              }}
              color="GrayText"
              variant="body2"
            >
              <em>전체 페이지</em> 목록
            </Typography>
          </Stack>
          <PageSelectList pageList={pageList ?? []} onClickPage={handleClickPage} />
        </Stack>
      </Stack>
      {dialogId === 'NavSectionEditDialog' && navSectionEditDialogProps && (
        <NavSectionEditDialog {...navSectionEditDialogProps} />
      )}
    </Box>
  );
}
