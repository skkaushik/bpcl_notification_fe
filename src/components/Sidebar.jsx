
const Sidebar = () => {
  const navItems = [
    { name: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', active: true },
    
  ]
  return (
    <aside className="h-screen w-72 flex-shrink-0 border-r border-gray-300 bg-blue-100 flex flex-col">
      <div className="flex items-center gap-4 px-8 py-6 border-b border-gray-300">
        <div className="relative flex-shrink-0">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-2l blur opacity-50" />
          <div className="relative h-14 w-14 flex-shrink-0">
            <img
              src="/logo.png"
              alt="Notification Analytics Logo"
              className="h-full w-full rounded-2xl"
            />
          </div>
        </div>
        <div className="flex flex-col justify-center">
          <h1 className="text-xl font-black leading-none tracking-tight text-slate-900">Notifications Analytics</h1>
          {/* <p className="text-xs font-bold uppercase tracking-widest text-slate-800">Operations Hub</p> */}
        </div>
      </div>

     <nav className="mt-6 flex-2 space-y-6 px-5">
        {navItems.map((item) => (
          <a
            key={item.name}
            href="#"
            className={`flex items-center gap-4 rounded-2xl px-2 py-3 text-lg font-bold tracking-wide transition-all duration-200 ${
              item.active 
              ? 'bg-indigo-50 text-indigo-800' 
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
            </svg>
            {item.name}
          </a>
        ))}
      </nav>

    </aside>
  );
};

export default Sidebar;