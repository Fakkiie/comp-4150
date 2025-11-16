"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Customer = {
  customerid: number;
  email: string;
  fullname?: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const customerData = localStorage.getItem("customer");
    if (customerData) {
      setCustomer(JSON.parse(customerData));
    } else {
      router.replace("/login");
    }
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-600 text-sm">Loading profile...</p>
      </main>
    );
  }

  if (!customer) {
    return null; // Or some other UI while redirecting
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="relative z-10 mx-auto max-w-5xl px-4 py-8 space-y-8">
        <header className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
              User Profile
            </h1>
            <p className="text-sm md:text-base text-slate-500 mt-1">
              View and manage your profile information.
            </p>
          </div>
          <button
            onClick={() => router.push("/")}
            className="inline-flex items-center justify-center rounded-full bg-blue-600 px-4 py-2 text-xs md:text-sm font-medium text-white hover:bg-blue-700"
          >
            Back to Home
          </button>
        </header>

        <section className="bg-white rounded-lg shadow p-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">
                Profile Details
              </h2>
              <p className="text-sm text-slate-500">
                This is your personal information.
              </p>
            </div>
            <div className="border-t border-slate-200 pt-4">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-slate-500">
                    Full name
                  </dt>
                  <dd className="mt-1 text-sm text-slate-900">
                    {customer.fullname || "Not provided"}
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-slate-500">
                    Email address
                  </dt>
                  <dd className="mt-1 text-sm text-slate-900">
                    {customer.email}
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-slate-500">
                    Customer ID
                  </dt>
                  <dd className="mt-1 text-sm text-slate-900">
                    {customer.customerid}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
