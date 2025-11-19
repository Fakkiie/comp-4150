"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
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
  orderid: number;
  orderdate: string;
  status: string;
  totalamount: string;
  shippingAddress: string;
  items: OrderItem[];
};

export default function ProfilePage() {
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // const [showProfileDetails, setShowProfileDetails] = useState(true);
  // const [showCart, setShowCart] = useState(true);
  // const [showOrders, setShowOrders] = useState(true);
  const [activeSection, setActiveSection] = useState("personal");

  const API_BASE = (
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api"
  ).replace(/\/*$/, "");

  useEffect(() => {
    const customerData = localStorage.getItem("customer");
    if (customerData) {
      const parsedCustomer = JSON.parse(customerData) as Customer;
      setCustomer(parsedCustomer);

      const fetchProfileData = async () => {
        try {
          const [cartRes, ordersRes] = await Promise.all([
            fetch(`${API_BASE}/cart/${parsedCustomer.customerid}`),
            fetch(`${API_BASE}/orders/customer/${parsedCustomer.customerid}`),
          ]);

          let cartData: CartItem[] = [];
          let ordersData: Order[] = [];

          if (cartRes.ok) {
            cartData = await cartRes.json().catch(() => []);
          } else {
            console.error(
              "Cart fetch failed",
              cartRes.status,
              await cartRes.text().catch(() => "")
            );
          }

          if (ordersRes.ok) {
            ordersData = await ordersRes.json().catch(() => []);
          } else {
            console.error(
              "Orders fetch failed",
              ordersRes.status,
              await ordersRes.text().catch(() => "")
            );
          }

          setCart(Array.isArray(cartData) ? cartData : []);
          setOrders(Array.isArray(ordersData) ? ordersData : []);
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
      <Header />
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
        <div className="flex gap-6">
          {/* Left Sidebar */}
          <aside className="w-64 bg-white rounded-lg shadow p-4">
            <div className="border-b pb-4 mb-4">
              <p className="text-lg font-semibold text-slate-800">
                {customer.fullname || "User"}
              </p>
              <p className="text-sm text-slate-500">{customer.email}</p>
            </div>
            <nav className="space-y-2">
              <button
                onClick={() => setActiveSection("personal")}
                className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                  activeSection === "personal"
                    ? "bg-blue-600 text-white"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                👤 Personal Info
              </button>

              <button
                onClick={() => setActiveSection("orders")}
                className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                  activeSection === "orders"
                    ? "bg-blue-600 text-white"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                📦 Order History
              </button>

              <button
                onClick={() => setActiveSection("cart")}
                className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                  activeSection === "cart"
                    ? "bg-blue-600 text-white"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                🛒 Cart
              </button>
            </nav>
          </aside>

          {/* Right Content */}
          <section className="flex-1 bg-white rounded-lg shadow p-6 text-black font-normal">
            {activeSection === "personal" && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Personal Info</h2>
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

            {activeSection === "orders" && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Order History</h2>
                {orders.length > 0 ? (
                  <div className="space-y-6">
                    {orders.map((order) => (
                      <div
                        key={order.orderid}
                        className="border border-slate-200 rounded-lg p-4"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-semibold text-slate-900">
                              Order #{order.orderid}
                            </p>
                            <p className="text-sm text-slate-500">
                              {new Date(order.orderdate).toLocaleDateString()}
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
                            Total: ${Number(order.totalamount).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">
                    You have no past orders.
                  </p>
                )}
              </div>
            )}

            {activeSection === "cart" && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Active Cart</h2>
                {cart.length > 0 ? (
                  <ul className="divide-y divide-slate-200">
                    {cart.map((item, index) => (
                      <li
                        key={`${item.productId}-${index}`}
                        className="py-3 flex justify-between items-center"
                      >
                        <div>
                          <p className="font-medium text-slate-900">
                            {item.name}
                          </p>
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
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
