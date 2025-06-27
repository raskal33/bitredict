import { create } from "zustand";

export type Prediction = {
  title?: string;
  category?: string;
  description?: string;
  odds?: number;
  initialPoolSize?: number;
};

type Root = {
  prediction: Prediction | null;
  setPrediction: (e: Prediction) => void;
};

export const useCreatePrediction = create<Root>()((set) => ({
  prediction: {
    title: "",
    category: "",
    description: "",
  },
  setPrediction: (e) => set(() => ({ prediction: e })),
}));
