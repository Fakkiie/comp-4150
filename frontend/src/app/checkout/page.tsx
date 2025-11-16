"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Customer = {
  customerid: number;
  email: string;
  fullname?: string;
};

type CartItem = {
  productid: number;
  name: string;
  price: number;
  quantity: number;
  total_price: number;
};

export default function CheckoutPage() {
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [cartTotal, setCartTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [address, setAddress] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api").replace(
    /\/*$/,
    ""
  );

  // Auth & Load Cart 
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
    setCustomer(parsedCustomer);

    // Fetch Cart to get the Total Amount
    fetch(`${API_BASE}/cart/${parsedCustomer.customerid}`)
      .then((res) => res.json())
      .then((data: CartItem[]) => {
        // Calculate total locally
        const total = data.reduce((sum, item) => sum + Number(item.total_price), 0);
        setCartTotal(total);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load cart", err);
        setLoading(false);
      });
  }, [router, API_BASE]);

  //Handle Order Placement
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;

    setIsProcessing(true);

    try {
      // Call Order API
      const res = await fetch(`${API_BASE}/orders/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerid: customer.customerid,
          shippingaddress: address,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to place order");
      }

      alert(`Order Placed Successfully! Order ID: ${data.orderid}`);
      router.push("/orders");
      
    } catch (err: any) {
      console.error(err);
      alert(`Error: ${err.message}`);
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-600">Loading Checkout...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 flex justify-center">
      <div className="max-w-2xl w-full">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Checkout</h1>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          {/* Order Summary */}
          <div className="mb-8 pb-8 border-b border-slate-100">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">Order Summary</h2>
            <div className="flex justify-between items-center text-lg">
              <span className="text-slate-600">Total Amount</span>
              <span className="font-bold text-slate-900">${cartTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Form */}
          <form onSubmit={handlePlaceOrder} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Shipping Address
              </label>
              <textarea
                required
                rows={3}
                className="w-full rounded-lg border border-slate-300 p-3 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="123 Main St, City, Country"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            {/* Mock Payment Fields (Visual Only) */}
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Payment Details</h3>
              <div className="space-y-3">
                <input 
                  disabled 
                  className="w-full bg-white border border-slate-200 rounded p-2 text-sm text-slate-400 cursor-not-allowed"
                  value="**** **** **** 4242 (Mock Card)"
                />
                <div className="flex gap-3">
                  <input disabled className="w-1/2 bg-white border border-slate-200 rounded p-2 text-sm text-slate-400" value="12/25" />
                  <input disabled className="w-1/2 bg-white border border-slate-200 rounded p-2 text-sm text-slate-400" value="123" />
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                * This is a school project. No real payment is processed.
              </p>
            </div>

            <button
              type="submit"
              disabled={isProcessing || cartTotal === 0}
              className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? "Processing..." : `Pay $${cartTotal.toFixed(2)} & Place Order`}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}