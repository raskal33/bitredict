"use client";

import Button from "@/components/button";
import { useCreatePrediction } from "@/store/useCreatePrediction";
import Link from "next/link";
import React from "react";
import { useStore } from "zustand";

export default function Page() {
  const { prediction, setPrediction } = useStore(useCreatePrediction);

  return (
    <div
      className={`flex w-64 flex-col gap-4 rounded-lg bg-dark-3 p-4 lg:w-96`}
    >
      <div className={`space-y-2`}>
        <div className={`font-semibold`}>Prediction Title</div>
        <input
          id=""
          type="text"
          value={prediction?.title || ""}
          placeholder="e.g., BTC will reach $70,000 by December"
          className={`h-11 w-full rounded-md border-primary bg-dark-2 pl-4 text-sm focus:outline-none`}
          onChange={(e) =>
            setPrediction({
              ...prediction,
              title: e.target.value ?? "",
            })
          }
        />
      </div>

      <div className={`space-y-2`}>
        <div className={`font-semibold`}>Category</div>
        <select
          id="category"
          required
          value={prediction?.category || ""}
          className={`h-11 w-full rounded-md border-primary bg-dark-2 pl-4 text-sm focus:outline-none`}
          onChange={(e) =>
            setPrediction({
              ...prediction,
              category: e.target.value ?? "",
            })
          }
        >
          <option value="" disabled>
            Select a category
          </option>
          <option value="sports">Sports</option>
          <option value="cryptocurrency">Cryptocurrency</option>
          <option value="politics">Politics</option>
          <option value="entertainment">Entertainment</option>
        </select>
      </div>

      <div className={`space-y-2`}>
        <div className={`font-semibold`}>Event</div>
        <select
          id="event"
          required
          className={`h-11 w-full rounded-md border-primary bg-dark-2 pl-4 text-sm focus:outline-none`}
        >
          <option value="" disabled>
            Select a Event
          </option>
          <option value="1">Event 1</option>
          <option value="2">Event 2</option>
          <option value="3">Event 3</option>
          <option value="4">Event 4</option>
        </select>
      </div>

      <div className={`space-y-2`}>
        <div className={`font-semibold`}>Description (Optional)</div>
        <textarea
          id=""
          value={prediction?.description || ""}
          placeholder="Provide additional details about your prediction"
          className={`w-full rounded-md border-primary bg-dark-2 p-4 text-sm focus:outline-none`}
          onChange={(e) =>
            setPrediction({
              ...prediction,
              description: e.target.value ?? "",
            })
          }
        />
      </div>

      <Link href={"/create-prediction/advanced"} className={`self-end`}>
        <Button>Next</Button>
      </Link>
    </div>
  );
}
