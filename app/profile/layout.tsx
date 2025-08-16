import InfoComp from "./InfoComp";
import Nav from "./Nav";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <section className="container mx-auto px-4 py-6 space-y-6">
      <InfoComp />

      <div className="space-y-6">
        <Nav />
        {children}
      </div>
    </section>
  );
}
