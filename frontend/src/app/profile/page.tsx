"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Customer = {
  customerid: number;
  email: string;
  fullname?: string;
};

type CartItem = {
  productId: number;
  name: string;
  quantity: number;
  price: string;
};

type OrderItem = {
  productName: string;
  quantity: number;
  unitPrice: string;
};

type Order = {
  id: number;
  orderDate: string;
  status: string;
  totalAmount: string;
  shippingAddress: string;
  items: OrderItem[];
};

export default function ProfilePage() {
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // 🔹 New toggle states
  const [showProfileDetails, setShowProfileDetails] = useState(true);
  const [showCart, setShowCart] = useState(true);
  const [showOrders, setShowOrders] = useState(true);

  const API_BASE =
    (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api").replace(
      /\/*$/,
      ""
    );

  useEffect(() => {
    const customerData = localStorage.getItem("customer");
    if (customerData) {
      const parsedCustomer = JSON.parse(customerData) as Customer;
      setCustomer(parsedCustomer);

      const fetchProfileData = async () => {
        try {
          const [cartRes, ordersRes] = await Promise.all([
            fetch(`${API_BASE}/customer/${parsedCustomer.customerid}/cart`),
            fetch(`${API_BASE}/customer/${parsedCustomer.customerid}/orders`),
          ]);

          if (!cartRes.ok)
            throw new Error(`Failed to fetch cart: ${cartRes.status}`);
          if (!ordersRes.ok)
            throw new Error(`Failed to fetch orders: ${ordersRes.status}`);

          setCart(await cartRes.json().catch(() => []));
          setOrders(await ordersRes.json().catch(() => []));
        } catch (error) {
          console.error("Failed to load profile data", error);
        } finally {
          setLoading(false);
        }
      };

      fetchProfileData();
    } else {
      router.replace("/login");
      setLoading(false);
    }
  }, [router, API_BASE]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-600 text-sm">Loading profile...</p>
      </main>
    );
  }

  if (!customer) return null;

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

        {/* Profile Details */}
        <section className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">
                Profile Details
              </h2>
            </div>

            <button
              onClick={() => setShowProfileDetails(!showProfileDetails)}
              className="text-xs px-3 py-1 rounded-full bg-blue-600 hover:bg-blue-700"
            >
              {showProfileDetails ? "Hide" : "Show"}
            </button>
          </div>

          {showProfileDetails && (
            <div className="border-t border-slate-200 pt-4 mt-4">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-slate-500">
                    Full name
                  </dt>
                  <dd className="mt-1 text-sm text-slate-900">
                    {customer.fullname || "Not provided"}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-slate-500">
                    Email address
                  </dt>
                  <dd className="mt-1 text-sm text-slate-900">
                    {customer.email}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-slate-500">
                    Customer ID
                  </dt>
                  <dd className="mt-1 text-sm text-slate-900">
                    {customer.customerid}
                  </dd>
                </div>
              </dl>
            </div>
          )}
        </section>

        {/* Active Cart */}
        <section className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">Active Cart</h2>

            <button
              onClick={() => setShowCart(!showCart)}
              className="text-xs px-3 py-1 rounded-full bg-blue-600 hover:bg-blue-700"
            >
              {showCart ? "Hide" : "Show"}
            </button>
          </div>

          {showCart && (
            <>
              {cart.length > 0 ? (
                <ul className="divide-y divide-slate-200">
                  {cart.map((item) => (
                    <li
                      key={item.productId}
                      className="py-3 flex justify-between items-center"
                    >
                      <div>
                        <p className="font-medium text-slate-900">{item.name}</p>
                        <p className="text-sm text-slate-500">
                          {item.quantity} x ${Number(item.price).toFixed(2)}
                        </p>
                      </div>
                      <p className="text-sm font-medium text-slate-900">
                        ${(item.quantity * Number(item.price)).toFixed(2)}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">Your cart is empty.</p>
              )}
            </>
          )}
        </section>

        {/* Order History */}
        <section className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">
              Order History
            </h2>

            <button
              onClick={() => setShowOrders(!showOrders)}
              className="text-xs px-3 py-1 rounded-full bg-blue-600 hover:bg-blue-700"
            >
              {showOrders ? "Hide" : "Show"}
            </button>
          </div>

          {showOrders && (
            <>
              {orders.length > 0 ? (
                <div className="space-y-6">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="border border-slate-200 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-semibold text-slate-900">
                            Order #{order.id}
                          </p>
                          <p className="text-sm text-slate-500">
                            {new Date(order.orderDate).toLocaleDateString()}
                          </p>
                        </div>

                        <span
                          className={`text-xs font-medium px-2 py-1 rounded-full ${
                            order.status === "Shipped"
                              ? "bg-green-100 text-green-800"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>

                      <ul className="text-sm divide-y divide-slate-100 mb-3">
                        {order.items.map((item, index) => (
                          <li
                            key={index}
                            className="py-2 flex justify-between"
                          >
                            <span>
                              {item.productName} (x{item.quantity})
                            </span>
                            <span>${Number(item.unitPrice).toFixed(2)}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="border-t border-slate-200 pt-2 text-right">
                        <p className="text-sm font-semibold text-slate-900">
                          Total: ${Number(order.totalAmount).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">You have no past orders.</p>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
