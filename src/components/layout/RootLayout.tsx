import { ReactNode } from "react";

interface RootLayoutProps {
  children: ReactNode;
  className?: string;
}

export function RootLayout({ children, className = "" }: RootLayoutProps) {
  return (
    <div
      className={`relative min-h-screen w-full bg-cover bg-center bg-no-repeat ${className}`}
      style={{ backgroundImage: "url('/sea.png')" }}
    >
      <div className="absolute inset-0 bg-black/40 pointer-events-none" />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
