"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
type Customer = {
  customerid: number;
  email: string;
  fullname?: string;
};

type Order = {
  id: number;              
  orderDate: string;       
  status: string;
  totalAmount: number;     
  shippingAddress: string; 
};

export default function MyOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api").replace(
    /\/*$/,
    ""
  );

  // Auth & Fetch Orders 
  useEffect(() => {
    let rawCustomer = null;
    try {
      rawCustomer = localStorage.getItem("customer");
    } catch {}

    if (!rawCustomer) {
      router.replace("/login");
      return;
    }

    const parsedCustomer = JSON.parse(rawCustomer) as Customer;
    
    // Fetch orders for this customer using the route orders.ts
    fetch(`${API_BASE}/orders/customer/${parsedCustomer.customerid}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
            setOrders(data);
        } else {
            console.error("API did not return an array", data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch orders", err);
        setLoading(false);
      });

  }, [router, API_BASE]);

  // Handle Cancel Order 
  const handleCancel = async (orderId: number) => {
    if (!confirm("Are you sure you want to cancel this order?")) return;

    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/cancel`, {
        method: "POST",
      });

      if (res.ok) {
        alert("Order cancelled successfully");
        // Refresh list locally to update status
        setOrders(prev => prev.map(o => 
          o.id === orderId ? { ...o, status: "Cancelled" } : o
        ));
      } else {
        const data = await res.json();
        alert(data.error || "Failed to cancel order");
      }
    } catch (err) {
      console.error(err);
      alert("Network error cancelling order");
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-600">Loading Orders...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="pb-2">
        <Header />
      </div>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-slate-900">My Orders</h1>
          <button
            onClick={() => router.push("/store")}
            className="text-blue-600 font-medium hover:underline"
          >
            Back to Store
          </button>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white p-8 rounded-xl shadow-sm text-center">
            <p className="text-slate-600 mb-4">You haven't placed any orders yet.</p>
            <button
              onClick={() => router.push("/store")}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-xl shadow-sm border border-slate-200 p-6"
              >
                <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Order #{order.id}
                    </h2>
                    <p className="text-sm text-slate-500">
                      Placed on {new Date(order.orderDate).toLocaleDateString()}
                    </p>
                  </div>
                  
                  {/* Status Badge */}
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    order.status === 'Cancelled' 
                      ? 'bg-red-100 text-red-800'
                      : order.status === 'Completed' || order.status === 'Shipped'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {order.status}
                  </span>
                </div>

                <div className="border-t border-slate-100 pt-4 mt-4 grid sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase mb-1">
                      Total Amount
                    </p>
                    <p className="text-lg font-medium text-slate-900">
                      ${Number(order.totalAmount).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase mb-1">
                      Shipping Address
                    </p>
                    <p className="text-sm text-slate-700">
                      {order.shippingAddress}
                    </p>
                  </div>
                </div>

                {order.status !== 'Cancelled' && (
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={() => handleCancel(order.id)}
                      className="text-red-600 text-sm font-medium hover:text-red-800 hover:underline"
                    >
                      Cancel Order
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}