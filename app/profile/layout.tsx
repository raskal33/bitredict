import InfoComp from "./InfoComp";
import Nav from "./Nav";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <section className="container mx-auto px-4 py-12 lg:py-20 space-y-12">
      <InfoComp />

      <div className="space-y-10">
        <Nav />
        <main className="min-h-[400px]">
          {children}
        </main>
      </div>
    </section>
  );
}
