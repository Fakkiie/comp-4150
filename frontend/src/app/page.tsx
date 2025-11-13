"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Customer = {
  customerid: number;
  email: string;
  fullname?: string;
};

export default function Home() {
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined"
        ? localStorage.getItem("customer")
        : null;

      if (!raw) {
        router.replace("/login");
        return;
      }

      const parsed = JSON.parse(raw) as Customer;
      setCustomer(parsed);
      setChecking(false);
    } catch {
      router.replace("/login");
    }
  }, [router]);

  const handleLogout = () => {
    try {
      localStorage.removeItem("customer");
    } catch {
      // ignore
    }
    router.replace("/login");
  };

  if (checking) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-slate-600 text-sm">Checking session…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">
              Hello, {customer?.fullname || customer?.email}
            </h1>
            <p className="text-sm text-slate-500">
              Welcome to the Bookstore Admin Dashboard.
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs font-medium text-red-600 border border-red-200 rounded-full px-3 py-1 hover:bg-red-50"
          >
            Log out
          </button>
        </div>
      </div>
    </main>
  );
}
