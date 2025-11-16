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

  // Helper to fix API URL trailing slashes
  const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api").replace(
    /\/*$/,
    ""
  );

  useEffect(() => {
    // Auth Check
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

    // Load Products & Cart Count
    const fetchData = async () => {
        // Fetch Products
        try {
          const prodRes = await fetch(`${API_BASE}/products`);
          if (prodRes.ok) {
              const prodData = await prodRes.json();
              setProducts(prodData);
          }
        } catch (e) {
          console.error("Product fetch failed", e);
        }

        // Fetch Cart Count
        try {
          const countRes = await fetch(`${API_BASE}/cart/count/${parsedCustomer.customerid}`);
          if (countRes.ok) {
              const countData = await countRes.json();
              setCartCount(countData.count);
          }
        } catch (e) {
          console.error("Cart count fetch failed", e);
        }
        
        setIsLoading(false);
    };

    fetchData();
  }, [router, API_BASE]);

  const handleAddToCart = async (productId: number) => {
    if (!customer) return;

    // Update UI immediately
    setCartCount(prev => prev + 1);

    try {
      // Call Backend
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
        // Revert if failed
        setCartCount(prev => prev - 1);
        alert("Failed to add item");
      }
    } catch (err) {
      setCartCount(prev => prev - 1);
      console.error(err);
    }
  };

  if (isLoading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        
        {/* TOP BAR: Header & Checkout Button */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 sticky top-4 z-10 bg-slate-50/95 backdrop-blur py-2 rounded-xl px-4 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-900">Store</h1>
          
          <button
            onClick={() => router.push("/checkout")} 
            disabled={cartCount === 0} // <-- Disable if empty
            className={`flex items-center gap-3 px-6 py-3 rounded-xl transition shadow-lg ${
              cartCount > 0 
                ? "bg-blue-600 text-white hover:bg-blue-700 transform active:scale-95 cursor-pointer" 
                : "bg-slate-300 text-slate-500 cursor-not-allowed shadow-none"
            }`}
          >
            <span className="font-bold">Proceed to Checkout</span>
            {cartCount > 0 && (
              <span className="bg-white text-blue-600 text-xs font-bold px-2 py-1 rounded-full">
                {cartCount}
              </span>
            )}
          </button>
        </div>

        {/* PRODUCTS GRID */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((p) => (
            <div key={p.id} className="bg-white rounded-xl shadow-sm p-5 border border-slate-200 flex flex-col hover:shadow-md transition">
              <div className="flex-grow mb-4">
                <h2 className="text-lg font-bold text-slate-900">{p.name}</h2>
                <p className="text-slate-600 mt-1">${Number(p.price).toFixed(2)}</p>
              </div>
              <button
                onClick={() => handleAddToCart(p.id)}
                className="w-full bg-slate-900 text-white font-medium py-2 rounded-lg hover:bg-slate-800 transition active:bg-slate-700"
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