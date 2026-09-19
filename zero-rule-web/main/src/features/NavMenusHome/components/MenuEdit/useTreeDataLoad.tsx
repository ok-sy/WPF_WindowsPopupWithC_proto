import handleError from '@/lib/handle-error';
import { useApi } from '@/provider';
import type { ApiRequestContext } from '@local/domain';
import type { CLNav, CLNavItem } from '@local/domain';
import { useCallback, useEffect, useState } from 'react';
import type { PageListItemInfo } from './types';
import errorCustomHandle from '@/lib/error-custom-handle';

type Result = {
  loading: boolean;
  nav?: CLNav;
  navItems: CLNavItem[];
  pageList: PageListItemInfo[];
  onVisableChange: (pageId: number) => void;
};

export function useTreeDataLoad(navId: number, refreshToken: number): Result {
  const api = useApi();
  const [loading, setLoading] = useState(true);
  const [navItemList, setNavItemList] = useState<CLNavItem[]>([]);
  const [navInfo, setNavInfo] = useState<CLNav>();

  const [pageList, setPageList] = useState<PageListItemInfo[]>([]);

  // 네비 정보와 네비아이템 목록을 불러온다
  const doReload = useCallback(
    async (ctx: ApiRequestContext, navId: number) => {
      try {
        setLoading(true);
        const { body } = await api.clNav.items({ ctx, navId, withHidden: false });
        const { nav, navItemList } = body;
        if (ctx.canceled) return;
        setNavItemList(navItemList);
        setNavInfo(nav);
        return navItemList;
      } catch (err) {
        // handleError(err)
        errorCustomHandle(err);
      } finally {
        setLoading(false);
      }
    },
    [api],
  );

  // 페이지 전체 목록
  const doPageReload = useCallback(
    async (ctx: ApiRequestContext, navItemList: CLNavItem[]) => {
      setLoading(true);
      try {
        const { body } = await api.clNav.pages({ ctx });
        const { pageList } = body;
        if (ctx.canceled) return;
        // 이미 존재하는 페이지
        const navPageIdArr = navItemList
          .flatMap((el) => {
            if (el.itemType === 'PAGE') return el.pageId;
            return el.subitems.map((el) => el.pageId);
          })
          .filter((it) => !!it);

        //이미 있는 녀석들이면 True 아니면 False
        setPageList(
          pageList.map((el) => {
            const visible: boolean = navPageIdArr.includes(el.pageId);
            return {
              pageId: el.pageId,
              pageNm: el.pageNm,
              icon: el.icon,
              hidden: false,
              itemType: 'PAGE',
              url: el.url,
              pageKey: el.pageKey,
              visible: visible,
            };
          }),
        );
      } catch (err) {
        // handleError(err)
        errorCustomHandle(err);
      } finally {
        setLoading(false);
      }
    },
    [api],
  );

  useEffect(() => {
    const ctx = { canceled: false } as ApiRequestContext;
    doReload(ctx, navId ?? 1).then((navItemList) => {
      if (navItemList) {
        doPageReload(ctx, navItemList);
      }
    });
    return () => {
      ctx.canceled = true;
      ctx.cancel?.();
    };
  }, [doReload, navId, refreshToken, doPageReload]);

  return {
    loading,
    nav: navInfo,
    navItems: navItemList,
    pageList: pageList,
    onVisableChange: (pageId: number) => {
      const changeIndex = pageList.findIndex((el) => el.pageId === pageId);
      const change = pageList.find((el) => el.pageId === pageId);
      if (!change) return;
      pageList.splice(changeIndex, 1, { ...change, visible: !change.visible });
      setPageList((p) => [...p]);
    },
  };
}
