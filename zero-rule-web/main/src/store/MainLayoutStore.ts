import log from '@/log';
import type { navigation } from '@local/ui';
import { action, computed, makeObservable, observable } from 'mobx';

type Position = { x: number; y: number };

/**
 * MainLayout의 상태를 보관하는 mobx 스토어
 */
export default class MainLayoutStore {
  constructor() {
    makeObservable(this);
  }

  /**
   * BODY 위치
   */
  @observable private bodyPosition_: Position = { x: 0, y: 0 };

  /**
   * 사이드바 열림 상태
   */
  @observable private opened_ = false;

  /**
   * 사이드바 펼쳐진 sectionId 목록
   */
  @observable expandedSectionIds: navigation.MenuIdType[] = [];

  /**
   * 사이드바 자동열림 체크 여부
   * 최초 시점에 Large 화면은 열린 상태, Small화면은 닫힌 상태로 설정
   */
  @observable private isAutoOpenChecked_ = false;

  @computed get opened(): boolean {
    return this.opened_;
  }

  @computed get isAutoOpenChecked(): boolean {
    return this.isAutoOpenChecked_;
  }

  @computed get bodyPosition(): Position {
    return this.bodyPosition_;
  }

  /**
   * 사이드바 열림 상태 변경
   */
  @action setAutoOpenChecked = (checked: boolean) => {
    this.isAutoOpenChecked_ = checked;
  };

  /**
   * 사이드바 열림 상태 변경
   */
  @action setOpened = (opened: boolean) => {
    log.debug(`setOpen() changed to ${opened}`);
    this.opened_ = opened;
  };

  /**
   * 열림 상태 토글
   */
  @action toggleOpen = () => {
    log.debug(`toggleOpen() changed to ${!this.opened_}`);
    this.opened_ = !this.opened_;
  };

  /**
   * 왼쪽 메뉴 섹션 펼침 상태 토글
   * @param sectionId 토글 할 섹션 ID
   */
  @action toggleExpandSection = (sectionId: navigation.MenuIdType) => {
    const idx = this.expandedSectionIds.indexOf(sectionId);
    if (idx >= 0) {
      this.expandedSectionIds.splice(idx, 1);
    } else {
      this.expandedSectionIds.push(sectionId);
    }
    log.debug('this.expandedSectionIds=', this.expandedSectionIds);
  };

  /**
   * 왼쪽 메뉴 펼치기
   * @param sectionId 펼칠 섹션ID
   */
  @action expandSection = (sectionId: navigation.MenuIdType) => {
    const idx = this.expandedSectionIds.indexOf(sectionId);
    if (idx >= 0) return;
    log.debug('this.expandSection=', this.expandedSectionIds);
    this.expandedSectionIds.push(sectionId);
  };

  @action setBodyPosition = (position: Position) => {
    if (this.bodyPosition_.x !== position.x || this.bodyPosition_.y !== position.y) {
      this.bodyPosition_ = { x: position.x, y: position.y };
    }
  };
}
