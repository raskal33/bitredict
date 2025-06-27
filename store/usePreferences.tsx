import { create } from "zustand";

export type Preferences = {
  defaultStake: number;
  maxBetLimit: number;
  preferredCategories: Array<string>;
};

type Root = {
  preferences?: Preferences;
  setPreferences: (e: Preferences) => void;
};

const usePreferences = create<Root>()((set) => ({
  preferences: {
    defaultStake: 10,
    maxBetLimit: 100,
    preferredCategories: [
      "sports",
      "cryptocurrency",
      "politics",
      "entertainment",
    ],
  },
  setPreferences: (e) => set(() => ({ preferences: e })),
}));

export { usePreferences };
