"use client";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <section className="flex flex-col min-h-screen">
      <div className="container-content py-8">
        {children}
      </div>
    </section>
  );
}
