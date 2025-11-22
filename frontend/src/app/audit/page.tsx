"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";

type AuditLog = {
  logid: number;
  actiondesc: string;
  entitytype: string;
  entityid: number;
  timestamp: string;
};

type Customer = {
  customerid: number;
  email: string;
  fullname?: string;
  isAdmin?: boolean; // CamelCase from API
  isadmin?: boolean; // lowercase fallback
};

export default function AuditPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api").replace(
    /\/*$/,
    ""
  );

  useEffect(() => {
    // Auth & Admin Check
    let rawCustomer = null;
    try {
      rawCustomer = localStorage.getItem("customer");
    } catch {}

    if (!rawCustomer) {
      router.replace("/login");
      return;
    }

    const user = JSON.parse(rawCustomer) as Customer;
    
    // Check for admin privileges
    if (user.isAdmin === true || user.isadmin === true) {
      setIsAuthorized(true);
      fetchLogs();
    } else {
      // Not an admin, redirect to home
      router.replace("/");
    }
  }, [router, API_BASE]);

  const fetchLogs = async () => {
    try {
      const res = await fetch(`${API_BASE}/audit`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      } else {
        console.error("Failed to fetch audit logs");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-600">Loading Audit Logs...</p>
      </main>
    );
  }

  if (!isAuthorized) return null;

  return (
    <main className="min-h-screen bg-slate-50">
      <Header />
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Audit Log</h1>
            <button
              onClick={() => router.push("/")}
              className="text-blue-600 font-medium hover:underline"
            >
              Back to Home
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="px-6 py-4 font-semibold">ID</th>
                    <th className="px-6 py-4 font-semibold">Action</th>
                    <th className="px-6 py-4 font-semibold">Entity Type</th>
                    <th className="px-6 py-4 font-semibold">Entity ID</th>
                    <th className="px-6 py-4 font-semibold">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                        No audit logs found.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.logid} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-slate-400">#{log.logid}</td>
                        <td className="px-6 py-4 font-medium text-slate-900">
                          {log.actiondesc}
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium border border-blue-100">
                            {log.entitytype}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600">{log.entityid}</td>
                        <td className="px-6 py-4 text-slate-500">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}