"use client";
import Button from "@/components/button";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex select-none flex-col items-center justify-center gap-16 font-semibold text-primary">
      <div className="flex items-center text-[8rem] lg:text-[16rem]">
        <div>4</div>
        <div>0</div>
        <div>4</div>
      </div>

      <Link href="/" className={``}>
        <Button variant="primary"> Back Home</Button>
      </Link>
    </div>
  );
}
