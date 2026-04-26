import { AsyncLocalStorage } from "node:async_hooks";

export interface RequestAuth {
  /** Bound profile id (profile-scoped key) or undefined (account-scoped). */
  profileId?: string;
  /** Profile id from request header (X-Personal-DB-Profile-Id), if provided. */
  headerProfileId?: string;
  /** All profile IDs owned by the user. */
  allProfileIds: string[];
  /** True when the key is account-scoped. */
  accountScoped: boolean;
  plan: string;
}

const storage = new AsyncLocalStorage<RequestAuth>();

export function getRequestAuth(): RequestAuth | undefined {
  return storage.getStore();
}

export function withRequestAuth<T>(auth: RequestAuth, fn: () => T): T {
  return storage.run(auth, fn);
}
