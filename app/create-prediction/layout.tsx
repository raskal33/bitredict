"use client";

import { useSelectedLayoutSegment } from "next/navigation";
import Link from "next/link";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const segment = useSelectedLayoutSegment();

  return (
    <section className={`flex grow flex-col gap-8`}>
      <h2 className="mb-6 text-center text-3xl font-semibold text-primary">
        Create a Prediction
      </h2>

      <div className="mb-6 flex flex-col items-center justify-center gap-4 p-4 lg:flex-row lg:gap-2">
        {links.map((e) => (
          <Link
            key={e.label}
            href={e.href}
            className={`${
              segment == e.segment ? "bg-black text-primary" : ""
            } rounded px-4 py-1 transition duration-500 hover:bg-black hover:text-primary`}
          >
            {e.label}
          </Link>
        ))}
      </div>
      {/* <SideMenu /> */}

      <div className={`w-fit self-center`}> {children}</div>
    </section>
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
