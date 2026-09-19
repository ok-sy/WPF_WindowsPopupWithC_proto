import type { NavManager } from '@/provider/NavManager';
import { createSceneElement, findSceneByUrl } from '@/scene/scene-router';
import type { CLNavPage } from '@local/domain';
import { toast } from 'react-toastify';
import type { Observable } from 'rxjs';
import {
  BehaviorSubject,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  shareReplay,
} from 'rxjs';
import type { IScene } from './types';

let seq_ = 1;
function nextId() {
  return ++seq_;
}

export class SceneManager {
  private readonly scenes$ = new BehaviorSubject<IScene[]>([]);
  private readonly currentSceneId$ = new BehaviorSubject<number | null>(null);
  private readonly currentScene$: Observable<IScene | null>;

  constructor(readonly nav: NavManager) {
    this.currentScene$ = combineLatest([this.scenes$, this.currentSceneId$]).pipe(
      debounceTime(50),
      map(([pages, sceneId]) => {
        if (pages.length === 0 || typeof sceneId === 'undefined' || sceneId === null) {
          return null;
        }
        return pages.find((it) => it.sceneId === sceneId) ?? null;
      }),
      distinctUntilChanged(),
      shareReplay(1),
    );
    console.log('PageManager created()');
  }

  count = () => this.scenes$.value.length;

  observeScenes = (): Observable<IScene[]> => {
    return this.scenes$;
  };

  observeCurrentSceneOrNull = (): Observable<IScene | null> => {
    return this.currentScene$;
  };

  observeSceneById = (sceneId: number): Observable<IScene | null> => {
    return this.currentScene$.pipe(filter((it) => it?.sceneId === sceneId));
  };

  observeCurrentIdOrNull = (): Observable<number | null> => {
    return this.currentSceneId$;
  };

  // url을 받아 등록된 url이면 탭에 추가, true와 false를 리턴
  addScene = (url: string, props?: any) => {
    console.log('SceneManager.addScene()', props);

    // url로 Scene 정보 가져옴
    const scene = findSceneByUrl(url);
    if (!scene) {
      console.warn('등록되지 않은 Scene입니다. scene-router.tsx에 등록해주세요', { url });
      return false;
    }

    // url로 Page정보 가져옴
    const page: CLNavPage | undefined = this.nav.findPageByUrl(url);

    // 컴포넌트와 Secnes와 아이디값을 받아서 next에서 추가해준다
    const component = createSceneElement(scene.component, props);
    const prevScenes = this.scenes$.value;
    const sceneId = nextId();

    // 탭의 뒤에 추가
    this.scenes$.next([
      ...prevScenes,
      {
        sceneId,
        pageKey: page?.pageKey ?? '',
        title: page?.pageNm ?? scene.title,
        url,
        component,
        revision: 0,
      },
    ]);
    this.currentSceneId$.next(sceneId);
    return true;
  };

  /**
   * 현재의 장면탭을 다른 URL로 변경한다
   * TODO 약간의 오류있음 조금더 이해후 해결
   */
  replaceScene = (url: string, props?: any) => {
    console.log('SceneManager.replaceScene()', url, props);
    const newSceneData = findSceneByUrl(url);
    if (!newSceneData) {
      console.warn('등록되지 않은 Scene입니다. scene-router.tsx에 등록해주세요', { url });
      return;
    }

    const page: CLNavPage | undefined = this.nav.findPageByUrl(url);

    const sceneId = this.currentSceneId$.value ?? nextId();
    const component = createSceneElement(newSceneData.component, props);
    const prevScenes = this.scenes$.value;

    const newScene: IScene = {
      sceneId,
      pageKey: page?.pageKey ?? '',
      title: page?.pageNm ?? newSceneData.title,
      url,
      component,
      revision: Date.now(),
    };

    const idx = prevScenes.findIndex((it) => it.sceneId === sceneId);
    if (idx < 0) {
      // 이런 경우가 발생하면 안됩
      console.warn('current scene not found');
      // 탭의 뒤에 추가
      this.scenes$.next([...prevScenes, newScene]);
    } else {
      const scenes = [...this.scenes$.value];
      scenes.splice(idx, 1, newScene);
      this.scenes$.next(scenes);
    }
    this.currentSceneId$.next(sceneId);
  };

  // 선택
  selectBySceneId = (sceneId: number) => {
    this.currentSceneId$.next(sceneId);
  };
  // 삭제 핸들
  deleteBySceneId = (sceneId: number) => {
    const oldScenes = this.scenes$.value;
    const newScenes = this.scenes$.value.filter((it) => it.sceneId !== sceneId);
    if (sceneId === this.currentSceneId$.value) {
      // 현재 페이지가 삭제된 경우 다른 페이지를 선택한다
      const index = oldScenes.findIndex((it) => it.sceneId === sceneId);
      if (index < 0) {
        console.log('delete index');
        return;
      }

      // 삭제후에 선택할 탭 선정
      if (newScenes.length === 0) {
        this.currentSceneId$.next(null);
      } else if (index >= newScenes.length) {
        // 마지막 탭을 삭제한 경우 마지막탭을 선택
        this.currentSceneId$.next(newScenes[newScenes.length - 1].sceneId);
      } else {
        // 우측의 탭을 선택
        this.currentSceneId$.next(newScenes[index].sceneId);
      }
    }

    this.scenes$.next(newScenes);
  };

  // 키값을 이용한 페이지 오픈
  routeByPageKey = (pageKey: string): boolean => {
    pageKey = pageKey.padStart(4, '0');
    const page = this.nav.findPageByPageKey(pageKey);
    if (!page) {
      toast.warn(`[${pageKey}] 해당 페이지를 찾을 수 없습니다. 메뉴의 페이지 목록을 확인해주세요`);
      return false;
    }

    return this.addScene(page.url);
  };

  findSceneByUrl = (url: string): IScene | undefined => {
    const scenes = this.scenes$.value;
    return scenes.find((it) => it.url === url);
  };
}
