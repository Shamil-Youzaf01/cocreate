"use client";

import { create } from "zustand";

const useAuthStore = create((set) => ({
  sessionVersion: 0,
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: ({ user, accessToken }) =>
    set((state) => ({
      sessionVersion: state.sessionVersion + 1,
      user,
      accessToken,
      isAuthenticated: true,
      isLoading: false,
    })),

  setUser: (user) => set({ user }),

  setAccessToken: (accessToken) =>
    set({
      accessToken,
      isAuthenticated: Boolean(accessToken),
    }),

  clearAuth: () =>
    set((state) => ({
      sessionVersion: state.sessionVersion + 1,
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
    })),

  setLoading: (isLoading) =>
    set({
      isLoading,
    }),
}));

export default useAuthStore;
