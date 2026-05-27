import Header from './Header';

const Layout = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans text-slate-900">
      <div className="flex flex-1 flex-col overflow-x-hidden min-w-0">
        <Header />
        <main className="p-4 sm:px-8 sm:py-6 w-full">
          <div className="w-full">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default Layout;