
const Sidebar = () => {
  const navItems = [
    { name: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', active: true },
    { name: 'Analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', active: false },
    { name: 'Equipment', icon: 'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z', active: false },
  ];

  return (
    <aside className="sticky top-0 hidden h-screen w-72 border-r border-slate-200 bg-white lg:flex flex-col">
      <div className="flex items-center gap-4 px-8 py-8 border-b border-slate-200">
        <div className="relative flex-shrink-0">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-2xl blur opacity-75" />
          <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-lg">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold tracking-tight text-slate-900">BPCL</h1>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Operations Hub</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-4">
        {navItems.map((item) => (
          <a
            key={item.name}
            href="#"
            className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
              item.active 
              ? 'bg-indigo-50 text-indigo-600' 
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
            </svg>
            {item.name}
          </a>
        ))}
      </nav>

      <div className="p-4">
        <div className="rounded-2xl bg-slate-900 p-4 shadow-xl">
          <p className="text-xs font-medium text-slate-400">System Status</p>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            <p className="text-sm font-semibold text-white">All Units Normal</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;