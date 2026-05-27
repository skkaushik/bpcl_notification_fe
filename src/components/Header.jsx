const Header = () => {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-blue-100/90 backdrop-blur-md px-4 sm:px-6 py-2.5 sm:py-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
          {/* Logo and Brand Name */}
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0">
              <img
                src="/logo.png"
                alt="Notification Analytics Logo"
                className="h-full w-full rounded-lg"
              />
            </div>
            <h1 className="text-base sm:text-lg font-black leading-none tracking-tight text-slate-900">
              Notifications Analytics
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <button className="relative rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 transition-colors">
            <div className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-red-500 border border-white" />
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11a6 6 0 0 0-4-5.659V5a2 2 0 0 0-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0a3 3 0 0 1-6 0"/></svg>
          </button>
          <div className="hidden sm:block h-6 w-px bg-slate-200" />
          <div className="flex items-center gap-2">
            <div className="hidden sm:block text-right leading-tight">
              <p className="text-xs font-bold text-slate-900">Ankur Sharma</p>
              <p className="text-[10px] font-medium text-slate-500">Site Manager</p>
            </div>
            <div className="h-8 w-8 rounded-lg bg-slate-200 ring-2 ring-white overflow-hidden shadow-sm flex-shrink-0">
              <img src="https://ui-avatars.com/api/?name=Ankur+Sharma&background=6366f1&color=fff" alt="User" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;