import type { UserProfile } from '@local/domain';

export class LoginProfileWrapper {
  public readonly isMaster: boolean;

  constructor(public readonly profile: UserProfile) {
    // TODO profile 관련 로직 추가
    this.isMaster = true; // roles.includes('MASTER')
  }
}
