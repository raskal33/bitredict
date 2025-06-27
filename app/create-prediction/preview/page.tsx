"use client";

import Button from "@/components/button";
import { useCreatePrediction } from "@/store/useCreatePrediction";
import { useStore } from "zustand";

export default function Page() {
  const { prediction } = useStore(useCreatePrediction);

  return (
    <div
      className={`flex w-64 flex-col gap-4 rounded-lg bg-dark-3 p-4 lg:w-96`}
    >
      <div className={`space-y-2`}>
        {" "}
        <div className={`font-semibold`}>Prediction Preview</div>
      </div>

      <div className={`grid grid-cols-2 *:h-fit *:py-1`}>
        <p className={`bg-dark-2`}> Title: </p>
        <p className={`bg-dark-2 text-disabled-1`}>
          {prediction?.title || "N/A"}
        </p>

        <p> Category: </p>
        <p className={`text-disabled-1`}>{prediction?.category || "N/A"}</p>

        <p className={`bg-dark-2`}> Description: </p>
        <p className={`break-words bg-dark-2 text-disabled-1`}>
          {prediction?.description || "No description provided."}
        </p>

        <p> Odds: </p>
        <p className={`text-disabled-1`}>{prediction?.odds || "N/A"}</p>

        <p className={`bg-dark-2`}> Pool Size: </p>
        <p className={`bg-dark-2 text-disabled-1`}>
          {prediction?.initialPoolSize || "N/A SOL"}
        </p>
      </div>

      <Button fullWidth>Submit Prediction</Button>
    </div>
  );
}
