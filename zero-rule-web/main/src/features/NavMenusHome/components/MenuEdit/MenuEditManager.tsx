import { StringToMuiIcon } from '@/components/StringToMuiIcon/StringToMuiIcon';
import type { CLNavItem, CLNavPage, CLNavSection } from '@local/domain';
import { ObservableField } from '@local/ui';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { IconButton, Stack, Typography } from '@mui/material';
import type { Observable } from 'rxjs';
import { Subject } from 'rxjs';
import type { MyTreeItem } from './types';

// 에디트 매니저 클래스
export class MenuEditManager {
  readonly treeItems$ = new ObservableField<MyTreeItem[]>([]);
  private readonly click$ = new Subject<number>();

  observeSectionClick = (): Observable<number> => {
    return this.click$;
  };

  // 섹션 추가
  addSection = (section: CLNavSection) => {
    const sectionInfo = sectionToTreeItem(section, this.handleClickSection);
    const treeItems = [...this.treeItems$.value];
    const idx = treeItems.findIndex((it) => it.type === 'SECTION' && it.id === section.sectionId);
    if (idx >= 0) {
      const old = treeItems[idx];
      const subPageItems = (old.children ?? []) as MyTreeItem[];
      const newSection: MyTreeItem = { ...sectionInfo, children: subPageItems };
      // 섹션 업데이트
      treeItems.splice(idx, 1, newSection);
    } else {
      // 신규 섹션 추가
      treeItems.push(sectionInfo);
    }
    this.treeItems$.setValue(treeItems);
  };

  // 섹션 삭제
  deleteSection = (sectionId: number) => {
    const treeItems = [...this.treeItems$.value];
    const sectionIndex = treeItems.findIndex((el) => el.id === sectionId);
    const children = (treeItems[sectionIndex].children ?? []) as MyTreeItem[];
    children.forEach((page) => {
      page.sectionId = undefined;
    });
    treeItems.splice(sectionIndex, 1, ...children);
    this.treeItems$.setValue(treeItems);
  };

  // 페이지 추가
  addPage = (page: CLNavPage) => {
    const newTreeData = pageToTreeItem(page, undefined);
    const treeItems = [...this.treeItems$.value, newTreeData];
    this.treeItems$.setValue(treeItems);
  };

  // 페이지 삭제
  deletePage = (pageId: number) => {
    const treeItems = [...this.treeItems$.value];
    const deletedPage1Step = treeItems.map((el) => {
      if (el.type === 'PAGE') return el;
      else if (!el.children) return;
      if (typeof el.children === 'function') return;
      const newChildrenArr = el.children.filter((el) => el.id !== pageId);
      return { ...el, children: newChildrenArr };
    }) as MyTreeItem[];
    const deletedPage2Step = deletedPage1Step.filter((el) => el.id !== pageId);
    this.treeItems$.setValue(deletedPage2Step);
  };

  replaceTreeItems = (treeItems: MyTreeItem[]) => {
    this.treeItems$.setValue(treeItems);
  };

  resetNavItems = (navItems: CLNavItem[]) => {
    const treeItems = navItems
      .map((el) => navItemToTreeItem(el, this.handleClickSection)) //
      .filter((it) => !!it) as MyTreeItem[];
    this.treeItems$.setValue(treeItems);
  };

  handleClickSection = (event: React.MouseEvent) => {
    const elem = event.currentTarget as HTMLElement;
    const sectionId = elem.dataset['sectionId'];
    if (!sectionId) {
      console.warn('unexcepted sectionId:', sectionId);
    } else {
      this.click$.next(+sectionId);
    }
  };
}

// 트리에 들어갈 네비 아이템 목록
function navItemToTreeItem(
  item: CLNavItem,
  sectionClickHandler: React.MouseEventHandler,
): MyTreeItem | null {
  if (item.itemType === 'SECTION') return sectionToTreeItem(item, sectionClickHandler);
  if (item.itemType === 'PAGE') return pageToTreeItem(item, undefined);
  return null;
}

// 트리에 들어갈 섹션 아이템
function sectionToTreeItem(
  section: CLNavSection,
  onClickSection: React.MouseEventHandler,
): MyTreeItem {
  const sectionId = section.sectionId;
  return {
    title: (
      <Stack direction="row" alignItems="center" sx={{ my: 1 }} data-menu-id={section.sectionId}>
        <Stack sx={{ minWidth: 19, maxHeight: 20 }}>
          <StringToMuiIcon iconName={section.icon ?? ''} />
        </Stack>
        <Typography ml={1} sx={{ fontSize: '0.9rem' }} variant="body1">
          {section.sectionNm}
        </Typography>
        <IconButton
          onClick={onClickSection}
          sx={{ ml: 2.5, height: 25 }}
          data-section-id={section.sectionId}
          size="small"
        >
          <InfoOutlinedIcon />
        </IconButton>
      </Stack>
    ),
    expanded: true,
    children: section.subitems.map((el) => pageToTreeItem(el, sectionId)),
    id: section.sectionId,
    type: 'SECTION',
  };
}

// 트리에 들어갈 페이지 아이템
function pageToTreeItem(page: CLNavPage, sectionId: number | undefined): MyTreeItem {
  const subtf = !page.icon;
  return {
    title: (
      <Stack direction="row" alignItems="center" sx={{ my: 1 }} data-menu-id={page.pageId}>
        <Stack sx={{ minWidth: 19, maxHeight: 17 }}>
          <StringToMuiIcon iconName={page.icon ?? ''} />
        </Stack>
        <Typography ml={1} sx={{ fontSize: subtf ? '0.75rem' : '0.9rem' }}>
          {page.pageNm}
        </Typography>
      </Stack>
    ),
    subtitle: undefined,
    children: undefined,
    sectionId,
    id: page.pageId,
    type: 'PAGE',
  };
}
