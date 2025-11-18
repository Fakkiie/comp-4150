"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import books from "../assets/books.jpg";
import Header from "../components/Header";

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
      const raw =
        typeof window !== "undefined" ? localStorage.getItem("customer") : null;

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

  const goToStore = () => router.push("/store");
  const goToProfile = () => router.push("/profile");

  if (checking) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-600 text-sm">Checking session…</p>
      </main>
    );
  }

  return (
    <>
      {/* render header full width and fixed to top */}
      <div className="w-full fixed top-0 left-0 z-30">
        <Header />
      </div>

      <main className="relative min-h-screen bg-slate-50 overflow-hidden pt-20">
        {/* Background image on right and fades left */}
        <div className="pointer-events-none absolute inset-y-0 right-0 w-full md:w-2/3">
          <Image
            src={books}
            alt="Bookstore shelves"
            fill
            priority
            className="object-cover"
          />

          <div className="absolute inset-y-0 left-0 w-2/3 bg-gradient-to-r from-slate-50 via-slate-50/80 to-transparent" />
        </div>

        {/* Foreground content */}
        <div className="relative z-10 mx-auto max-w-5xl px-4 py-8 space-y-8">
          {/* Main hero  */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4 max-w-lg">
              <h2 className="text-xl md:text-2xl font-semibold text-slate-900">
                Welcome to The Book Store
              </h2>
              <p className="text-sm md:text-base text-slate-600 leading-relaxed">
                Manage our curated collection of books, keep customer records up
                to date, and make sure the shelves—both physical and digital— stay
                organized. Use this dashboard as your home base for everything in
                our bookstore system.
              </p>

              <ul className="text-sm text-slate-600 space-y-1">
                <li>• Browse all books in the store</li>
                <li>• View and edit your cart</li>
              </ul>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  onClick={goToStore}
                  className="inline-flex items-center justify-center rounded-full bg-blue-600 px-4 py-2 text-xs md:text-sm font-medium text-white hover:bg-blue-700"
                >
                  Go to Store
                </button>
                <button
                  onClick={goToProfile}
                  className="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-xs md:text-sm font-medium text-slate-700 hover:bg-slate-100 bg-white/80 backdrop-blur-sm"
                >
                  View Profile
                </button>
              </div>
            </div>

            {/* Image sits behind this */}
            <div className="hidden md:block" />
          </section>
        </div>
      </main>
    </>
  );
}
