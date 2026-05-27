const Header = ({ onMenuClick }) => {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-blue-100 backdrop-blur-md px-4 sm:px-8 py-4 sm:py-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
          {/* Hamburger button for mobile */}
          <button 
            onClick={onMenuClick}
            className="lg:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-200 rounded-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
          </button>

          <div className="relative w-full max-w-md">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
          <button className="relative rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 transition-colors">
            <div className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 border-2 border-white" />
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11a6 6 0 0 0-4-5.659V5a2 2 0 0 0-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0a3 3 0 0 1-6 0"/></svg>
          </button>
          <div className="hidden sm:block h-8 w-px bg-slate-200" />
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right leading-tight">
              <p className="text-sm font-bold text-slate-900">Ankur Sharma</p>
              <p className="text-xs font-medium text-slate-500">Site Manager</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-slate-200 ring-2 ring-white overflow-hidden shadow-sm flex-shrink-0">
              <img src="https://ui-avatars.com/api/?name=Ankur+Sharma&background=6366f1&color=fff" alt="User" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;