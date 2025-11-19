"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Header() {
  const router = useRouter();
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      if (raw) {
        const c = JSON.parse(raw);
        setName(c.fullname || c.email || null);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleLogout = () => {
    try {
      localStorage.removeItem("user");
    } catch {
      // ignore
    }
    router.replace("/login");
  };

  return (
    <header className="flex items-center justify-between px-4 py-3 bg-white shadow-sm">
      <div className="flex items-center gap-4">
        <Link href="/" className="text-lg font-bold">
          Bookstore
        </Link>
        <nav className="hidden md:flex items-center gap-3 text-sm">
          <Link href="/store" className="text-slate-600 hover:text-slate-900">
            Store
          </Link>
          {user?.isAdmin && (
            <Link href="/products" className="text-slate-600 hover:text-slate-900">
              Products
            </Link>
          )}
          <Link href="/orders" className="text-slate-600 hover:text-slate-900">
            Orders
          </Link>
        </nav>
      </div>

      <div className="flex items-center gap-3">
        {name && <span className="text-sm text-slate-700 hidden sm:inline">Hi, {name}</span>}
        <button
          onClick={() => router.push("/profile")}
          className="text-sm text-slate-700 px-3 py-1 border rounded"
        >
          Profile
        </button>
        <button
          onClick={handleLogout}
          className="text-sm text-red-600 px-3 py-1 border border-red-200 rounded hover:bg-red-50"
        >
          Log out
        </button>
      </div>
    </header>
  );
}
