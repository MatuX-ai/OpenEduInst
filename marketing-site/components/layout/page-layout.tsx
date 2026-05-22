import Header from "./header";
import Footer from "../landing/footer";

interface PageLayoutProps {
  children: React.ReactNode;
  showFooter?: boolean;
}

export default function PageLayout({ children, showFooter = true }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      {showFooter && <Footer />}
    </div>
  );
}
