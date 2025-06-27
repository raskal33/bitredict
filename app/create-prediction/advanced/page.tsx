"use client";

import Button from "@/components/button";
import { useCreatePrediction } from "@/store/useCreatePrediction";
import Link from "next/link";
import { useStore } from "zustand";

export default function Page() {
  const { prediction, setPrediction } = useStore(useCreatePrediction);

  return (
    <div
      className={`flex w-64 flex-col gap-4 rounded-lg bg-dark-3 p-4 lg:w-96`}
    >
      <div className={`flex select-none items-center gap-4`}>
        <div className={`flex items-center gap-2`}>
          <input
            type="radio"
            name="group1"
            id="option1"
            value="YES"
            defaultChecked
            className={`size-4 cursor-pointer appearance-none rounded-full bg-white checked:bg-primary`}
          />
          <label htmlFor="option1">YES</label>
        </div>

        <div className={`flex items-center gap-2`}>
          <input
            type="radio"
            name="group1"
            id="option1"
            value="YES"
            className={`size-4 cursor-pointer appearance-none rounded-full bg-white checked:bg-primary`}
          />
          <label htmlFor="option2">NO</label>
        </div>
      </div>

      <div className={`space-y-2`}>
        <div className={`font-semibold`}>Odds</div>
        <input
          id=""
          min={0}
          value={prediction?.odds || ""}
          placeholder="e.g., 2.5"
          className={`h-11 w-full rounded-md border-primary bg-dark-2 pl-4 text-sm focus:outline-none`}
          onInput={(e) =>
            (e.currentTarget.value = e.currentTarget.value.replace(
              /[^0-9.]/g,
              "",
            ))
          }
          onChange={(e) =>
            setPrediction({
              ...prediction,
              odds: Number(e.target.value) ?? undefined,
            })
          }
        />
        <p className={`text-xs text-disabled-1`}>
          Set the multiplier for this prediction.
        </p>
      </div>

      <div className={`space-y-2`}>
        <div className={`font-semibold`}>Initial Pool Size</div>
        <input
          id=""
          min={0}
          value={prediction?.initialPoolSize || ""}
          placeholder="e.g., 100"
          className={`h-11 w-full rounded-md border-primary bg-dark-2 pl-4 text-sm focus:outline-none`}
          onInput={(e) =>
            (e.currentTarget.value = e.currentTarget.value.replace(
              /[^0-9.]/g,
              "",
            ))
          }
          onChange={(e) =>
            setPrediction({
              ...prediction,
              initialPoolSize: Number(e.target.value) ?? undefined,
            })
          }
        />
        <p className={`text-xs text-disabled-1`}>
          Specify the initial amount of SOL for this prediction pool.
        </p>
      </div>
      <Link href={"/create-prediction/preview"} className={`self-end`}>
        <Button>Next</Button>
      </Link>
    </div>
  );
}
