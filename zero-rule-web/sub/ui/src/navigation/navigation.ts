import { LRUCache } from 'lru-cache';

export type MenuIdType = string | number;

export type MatchFn = (path: string) => boolean;

export interface IDivider {
  id: MenuIdType;
  type: 'divider';
  sectionId?: MenuIdType;
}

export interface ILabel {
  id: MenuIdType;
  type: 'label';
  icon?: React.ReactNode | string;
  title: string;
  sectionId?: MenuIdType;
}

export interface IMenu {
  id: MenuIdType;
  type: 'menu';
  title: string;
  href: string;
  icon?: React.ReactNode;
  sectionId?: MenuIdType;
  pageKey?: string;
  match?: MatchFn;
}

/**
 * Section 객체
 * Section 객체는 id와 sectionId가 동일하다
 */
export interface ISection {
  id: MenuIdType;
  type: 'section';
  icon?: React.ReactNode;
  title: string;
  sectionId: MenuIdType;
  submenus: (IDivider | IMenu)[];
}

export type ISideMenuItem = ILabel | IDivider | IMenu | ISection;

export type ISectionWithoutId = {
  submenus: (Omit<IDivider, 'id' | 'sectionId'> | Omit<IMenu, 'id' | 'sectionId'>)[];
} & Omit<ISection, 'id' | 'sectionId' | 'submenus'>;

export type ISideMenuItemWithoutId =
  | Omit<ILabel, 'id' | 'sectionId'>
  | Omit<IDivider, 'id' | 'sectionId'>
  | Omit<IMenu, 'id' | 'sectionId'>
  | ISectionWithoutId;

function assignId(generateMenuId: () => MenuIdType, item: ISideMenuItemWithoutId): ISideMenuItem {
  const id = generateMenuId();
  if (item.type === 'divider') {
    return { ...item, id } as IDivider;
  }

  if (item.type === 'label') {
    return { ...item, id } as ILabel;
  }

  if (item.type === 'menu') {
    return { ...item, id } as IMenu;
  }

  if (item.type === 'section') {
    const sectionId = id;
    const section = { ...item, id, sectionId } as ISection;
    if (!section.submenus || section.submenus.length === 0) return section;
    section.submenus = section.submenus.map((it) => {
      if (it.type === 'divider') {
        return { ...it, id: generateMenuId(), sectionId } as IDivider;
      }
      if (it.type === 'menu') {
        return { ...it, id: generateMenuId(), sectionId } as IMenu;
      }
      throw new Error('unknown side submenu type');
    });
    return section;
  }

  throw new Error('unknown side menu item type');
}

type MenuIdGeneratorFn = () => MenuIdType;

let seq = 0;
const defaultIdGenerator = () => `autoid_${++seq}`;

export function configureSideMenus(
  menuItems: ISideMenuItemWithoutId[],
  generateId: MenuIdGeneratorFn = defaultIdGenerator,
): MenuManager {
  return new MenuManager(menuItems.map((it) => assignId(generateId, it)));
}

export class MenuManager {
  private menuMatchedCache_ = new LRUCache<string, IMenu>({
    max: 500,
  });

  private sectionMatchedCache_ = new LRUCache<string, ISection>({
    max: 500,
  });

  private sectionsById_: Record<MenuIdType, ISection> = {};
  private menusById_: Record<MenuIdType, IMenu> = {};

  constructor(public readonly menuItems: ISideMenuItem[]) {
    menuItems.forEach((item) => {
      if (item.type === 'section') {
        this.sectionsById_[item.id] = item;
      }
      if (item.type === 'menu') {
        this.menusById_[item.id] = item;
      }
    });
  }

  isEmpty = () => {
    return this.menuItems.length === 0;
  };

  isMenuPathMatched = (menu: IMenu, currentPath: string | undefined | null): boolean => {
    if (!currentPath) return false;

    // check cache
    const cachedMenuItem = this.menuMatchedCache_.get(currentPath);
    if (!!cachedMenuItem) {
      // console.log('menu cache hit: ', { currentPath, title: menu.title })
      return cachedMenuItem.id === menu.id;
    }

    const matched = isMenuPathMatched_(menu, currentPath);
    if (matched) {
      // save to cache
      // console.log('menu cache saved', { currentPath, title: menu.title })
      this.menuMatchedCache_.set(currentPath, menu);
      const sectionId = menu.sectionId;
      if (sectionId) {
        const section = this.sectionsById_[sectionId];
        if (!section) {
          throw new Error('unexcepted state: section is not exists: sectionId=' + sectionId);
        }
        this.sectionMatchedCache_.set(currentPath, section);
      }
    }
    return matched;
  };

  isSectionPathMatched = (section: ISection, currentPath: string | undefined | null): boolean => {
    if (!currentPath) return false;

    // check cache
    const cachedItem = this.sectionMatchedCache_.get(currentPath);
    if (!!cachedItem) {
      // console.log('section cache hit: ', { currentPath, title: section.title })
      return cachedItem.id === section.id;
    }

    const matched = section.submenus.some(
      (it) => it.type === 'menu' && this.isMenuPathMatched(it, currentPath),
    );
    if (matched) {
      // save to cache
      // console.log('section cache saved', { currentPath, title: section.title })
      this.sectionMatchedCache_.set(currentPath, section);
    }
    return matched;
  };
}

const isMenuPathMatched_ = (menuItem: IMenu, currentPath: string | undefined | null): boolean => {
  if (!currentPath) return false;
  const menuPath = menuItem.href;

  // 가장 빠르게 비교
  if (menuPath === currentPath) return true;

  // 매치 함수가 있다면 매치 함수로 체크
  if (menuItem.match) {
    return menuItem.match(currentPath);
  }

  // menuPath에 '?'가 없는 경우 매치
  if (menuPath.indexOf('?') < 0) {
    if (currentPath.indexOf('?') > 0) {
      return currentPath.indexOf(menuPath + '?') >= 0;
    }
    return false;
  }

  // menuPath에 '?'가 있다면
  // currentPath에 menuPath가 포함하고 있어야 한다.
  return currentPath.startsWith(menuPath);
};
