"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Customer = {
  customerid: number;
  email: string;
  fullname?: string;
};

type Product = {
  id: number;
  name: string;
  price: number;
};

export default function StorePage() {
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api").replace(
    /\/*$/,
    ""
  );

  //Auth & Initial Load
  useEffect(() => {
    //Check Auth
    let rawCustomer: string | null = null;
    try {
      rawCustomer = localStorage.getItem("customer");
    } catch (err) {
      router.replace("/login");
      return;
    }

    if (!rawCustomer) {
      router.replace("/login");
      return;
    }

    const parsedCustomer = JSON.parse(rawCustomer) as Customer;
    setCustomer(parsedCustomer);

    Promise.all([
      fetchProducts(),
      fetchCartCount(parsedCustomer.customerid)
    ]).finally(() => setIsLoading(false));

  }, [router]);

  // Data Fetching
  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_BASE}/products`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.error("Failed to load products", err);
    }
  };

  const fetchCartCount = async (customerId: number) => {
    try {
      const res = await fetch(`${API_BASE}/cart/count/${customerId}`);
      if (res.ok) {
        const data = await res.json();
        setCartCount(data.count);
      }
    } catch (err) {
      console.error("Failed to load cart count", err);
    }
  };

  //Add to Cart Handler
  const handleAddToCart = async (productId: number) => {
    if (!customer) return;

    // Update UI
    setCartCount(prev => prev + 1);

    try {
      const res = await fetch(`${API_BASE}/cart/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: customer.customerid,
          productId: productId,
          quantity: 1,
        }),
      });

      if (!res.ok) {
        // Revert on failure
        setCartCount(prev => prev - 1);
        alert("Failed to add item.");
      }
    } catch (err) {
      setCartCount(prev => prev - 1);
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-slate-600">Loading Store...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 sticky top-4 z-10 bg-slate-50/90 backdrop-blur-sm py-2">
          <h1 className="text-3xl font-bold text-slate-900">Store</h1>
          
          <button
            onClick={() => router.push("/checkout")}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition shadow-lg transform active:scale-95"
          >
            <span className="font-bold">Proceed to Checkout</span>
            {cartCount > 0 && (
              <span className="bg-white text-blue-600 text-xs font-bold px-2 py-1 rounded-full min-w-[20px] text-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-2xl shadow-sm p-5 border border-slate-100 flex flex-col hover:shadow-md transition"
            >
              <div className="flex-grow mb-4">
                <h2 className="text-lg font-bold text-slate-900">{p.name}</h2>
                <p className="text-slate-600 font-medium mt-1">
                  ${Number(p.price).toFixed(2)}
                </p>
              </div>
              <button
                onClick={() => handleAddToCart(p.id)}
                className="w-full bg-slate-900 text-white font-medium py-2.5 px-4 rounded-lg hover:bg-slate-800 transition active:bg-slate-700"
              >
                Add to Cart
              </button>
            </div>
          ))}
        </div>

      </div>
    </main>
  );
}