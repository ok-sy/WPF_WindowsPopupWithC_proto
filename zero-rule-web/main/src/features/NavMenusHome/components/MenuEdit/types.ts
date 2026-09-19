import type { TreeItem } from 'react-sortable-tree';

// 기존트리타입에 추가할 타입
export type TreeKey = { id: number; type: 'PAGE' | 'SECTION'; sectionId?: number };

// 트리에 들어갈 타입
export type MyTreeItem = TreeItem<Partial<TreeKey>>;

export type SortedItems = Array<{
  pageId: number;
  sectionId?: number;
}>;

export interface SectionInfo {
  sectionId: number;
  sectionNm: string;
  icon?: string;
}

export interface PageListItemInfo {
  pageId: number;
  itemType: 'PAGE';
  pageNm: string;
  pageKey?: string;
  url: string;
  icon?: string;
  hidden: boolean;
  visible: boolean;
}
