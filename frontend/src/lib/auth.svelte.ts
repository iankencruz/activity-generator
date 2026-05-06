// src/lib/auth.svelte.ts
import { pb } from "./pocketbase";

class AuthState {
  user = $state(pb.authStore.model);
  isValid = $derived(!!this.user);

  constructor() {
    // Listen for store changes (login/logout)
    pb.authStore.onChange((token, model) => {
      this.user = model;
    });
  }

  logout() {
    pb.authStore.clear();
  }
}

export const auth = new AuthState();
