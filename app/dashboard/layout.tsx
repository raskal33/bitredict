import SideMenu from "./SideMenu";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-bg-main">
      <div className="container py-4 md:py-8">
        <section className="flex flex-col gap-6 xl:gap-8 xl:flex-row">
          <SideMenu />
          <main className="flex-1 min-w-0 overflow-hidden">
            {children}
          </main>
        </section>
      </div>
    </div>
  );
}
