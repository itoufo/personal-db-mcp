import { AsyncLocalStorage } from "node:async_hooks";

export interface RequestAuth {
  profileId: string;
  plan: string;
}

const storage = new AsyncLocalStorage<RequestAuth>();

export function getRequestAuth(): RequestAuth | undefined {
  return storage.getStore();
}

export function withRequestAuth<T>(auth: RequestAuth, fn: () => T): T {
  return storage.run(auth, fn);
}
