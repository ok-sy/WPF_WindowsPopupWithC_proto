import type { CLNavItem, CLNavPage } from '@local/domain';
import { navigation, ObservableField } from '@local/ui';
import type { Observable } from 'rxjs';

// local ui로 옮길 수도 있겠다
export class NavManager {
  private readonly menus$ = new ObservableField(new navigation.MenuManager([]));

  // key=pageKey, value=CLNavPage
  private pageByPageKey_: Record<string, CLNavPage> = {};

  // key=url, value=CLNavPage
  private pageByUrl_: Record<string, CLNavPage> = {};

  getMenuManager = () => this.menus$.value;

  observeMenuManager = (): Observable<navigation.MenuManager> => this.menus$.observe();

  private navPageToMenuItem_ = (navItem: CLNavPage): Omit<navigation.IMenu, 'id' | 'sectionId'> => {
    const { pageNm, url, pageKey, icon } = navItem;
    const menuItem: Omit<navigation.IMenu, 'id' | 'sectionId'> = {
      type: 'menu',
      title: pageNm,
      href: url,
      pageKey,
      icon,
    };
    return menuItem;
  };

  private navItemToMenuItem_ = (navItem: CLNavItem): navigation.ISideMenuItemWithoutId => {
    if (navItem.itemType === 'PAGE') {
      return this.navPageToMenuItem_(navItem);
    }

    // section
    const { sectionId, sectionNm, subitems, icon } = navItem;
    const section: navigation.ISectionWithoutId = {
      type: 'section',
      icon,
      title: sectionNm,
      submenus: subitems.map(this.navPageToMenuItem_),
    };
    return section;
  };

  setNavItems = (items: CLNavItem[]) => {
    const menuManager = navigation.configureSideMenus(items.map(this.navItemToMenuItem_));
    const pageByPageKeys: Record<string, CLNavPage> = {};
    const pageByUrl: Record<string, CLNavPage> = {};
    items.forEach((item) => {
      if (item.itemType === 'PAGE') {
        const page = item as CLNavPage;
        if (page.pageKey) {
          pageByPageKeys[page.pageKey] = page;
        }
        pageByUrl[page.url] = page;
      } else {
        item.subitems.forEach((subitem) => {
          if (subitem.pageKey) {
            pageByPageKeys[subitem.pageKey] = subitem;
          }
          pageByUrl[subitem.url] = subitem;
        });
      }
    });

    this.pageByPageKey_ = pageByPageKeys;
    this.pageByUrl_ = pageByUrl;
    console.log('NavManager.setNavItems()', menuManager.menuItems);
    this.menus$.setValue(menuManager);
  };

  findPageByPageKey = (pageKey: string): CLNavPage | undefined => {
    console.log('pageByPageKey_=', this.pageByPageKey_);
    return this.pageByPageKey_[pageKey];
  };

  findPageByUrl = (url: string): CLNavPage | undefined => {
    return this.pageByUrl_[url];
  };

  /**
   * 로그아웃인 경우 메뉴를 초기화한다
   */
  clear = () => {
    if (!this.menus$.value.isEmpty()) {
      console.log('clear menu items');
      this.menus$.setValue(new navigation.MenuManager([]));
      this.pageByPageKey_ = {};
      this.pageByUrl_ = {};
    }
  };
}
