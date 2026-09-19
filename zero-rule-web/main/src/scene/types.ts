export interface IScene {
  sceneId: number;
  title: string;
  url: string;
  pageKey: string;
  component: React.ReactNode;
  revision: number;
}
