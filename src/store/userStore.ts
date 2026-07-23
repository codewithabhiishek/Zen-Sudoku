import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createUser, getUser } from "@/database/api";

interface UserState {
  userId: string | null;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  isRegistered: boolean;
  initUser: () => Promise<string | null>;
  registerGuest: (username: string) => Promise<string>;
  updateUsername: (newUsername: string) => Promise<void>;
  deleteProfile: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      userId: null,
      username: "",
      displayName: "",
      avatarUrl: null,
      isRegistered: false,

      initUser: async () => {
        if (typeof window === "undefined") return null;
        let storedId = localStorage.getItem("zen_sudoku_user_id");

        if (storedId) {
          try {
            const profile = await getUser(storedId);
            if (profile) {
              set({
                userId: profile.id,
                username: profile.username || "",
                displayName: profile.displayName || profile.username || "",
                avatarUrl: profile.avatarUrl || null,
                isRegistered: true,
              });
              return storedId;
            }
          } catch (err) {
            console.warn("Failed to fetch user profile from Neon DB:", err);
          }
        }

        // If storedId exists locally but DB fetch failed, keep local state
        if (storedId && get().username) {
          set({ userId: storedId, isRegistered: true });
          return storedId;
        }

        return null;
      },

      registerGuest: async (rawUsername: string) => {
        const username = rawUsername.trim() || `ZenPlayer_${Math.floor(1000 + Math.random() * 9000)}`;
        const uuid = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `usr_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

        if (typeof window !== "undefined") {
          localStorage.setItem("zen_sudoku_user_id", uuid);
        }

        try {
          await createUser({
            id: uuid,
            username,
            displayName: username,
          });
        } catch (err) {
          console.error("Database registration error:", err);
        }

        set({
          userId: uuid,
          username,
          displayName: username,
          isRegistered: true,
        });

        return uuid;
      },

      updateUsername: async (newUsername: string) => {
        const { userId } = get();
        if (!userId) return;
        const username = newUsername.trim();
        if (!username) return;

        try {
          await createUser({
            id: userId,
            username,
            displayName: username,
          });
        } catch (err) {
          console.error("Failed to update username:", err);
        }

        set({ username, displayName: username });
      },

      deleteProfile: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("zen_sudoku_user_id");
          localStorage.removeItem("sudoku-user-v1");
        }
        set({
          userId: null,
          username: "",
          displayName: "",
          avatarUrl: null,
          isRegistered: false,
        });
      },
    }),
    { name: "sudoku-user-v1" }
  )
);
