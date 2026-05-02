import React from 'react';

export default function Navbar({ title, right }) {
  return (
    <header className="flex shrink-0 items-center justify-between border-b border-slate-700 bg-slate-900 px-6 py-4">
      <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
      <div className="flex flex-wrap items-center justify-end gap-3">{right}</div>
    </header>
  );
}
