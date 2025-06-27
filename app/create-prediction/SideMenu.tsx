"use client";

import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";

export default function SideMenu() {
  const segment = useSelectedLayoutSegment();

  return (
    <div
      className={`group-hover group relative col-span-full flex w-full shrink-0 select-none flex-col gap-4 rounded-lg bg-dark-2 text-disabled-1 xl:col-span-4 xl:w-64`}
    >
      <h2 className="mb-6 text-xl font-semibold text-secondary">
        Create a Prediction
      </h2>

      <div className={`flex flex-col gap-2 font-medium`}>
        {links.map((link) => (
          <Link
            key={link.segment}
            href={link.href}
            className={`${link.segment === segment ? "border-l-4 border-secondary pl-1" : ""} transition-all`}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

const links = [
  { label: "Basic", href: "/create-prediction", segment: null },
  {
    label: "Advanced",
    href: "/create-prediction/advanced",
    segment: "advanced",
  },
  {
    label: "Preview",
    href: "/create-prediction/preview",
    segment: "preview",
  },
];
