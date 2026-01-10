import SideMenu from "./SideMenu";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-bg-main relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-somnia-cyan/5 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-somnia-violet/5 rounded-full blur-[120px] animate-pulse-slow"></div>
        <div className="absolute top-[20%] left-[10%] w-[30%] h-[30%] bg-somnia-blue/5 rounded-full blur-[100px]"></div>

        {/* Modern Cyberpunk Grid Overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #22C7FF 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(to right, #22C7FF 1px, transparent 1px), linear-gradient(to bottom, #22C7FF 1px, transparent 1px)', backgroundSize: '160px 160px' }}></div>

        {/* Subtle Scanline Effect */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.02] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]"></div>
      </div>

      <div className="container-nav py-6 md:py-16">
        <section className="flex flex-col gap-10 xl:flex-row items-start">
          <SideMenu />
          <main className="flex-1 min-w-0 w-full">
            {children}
          </main>
        </section>
      </div>
    </div>
  );
}
