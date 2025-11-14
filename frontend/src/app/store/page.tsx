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


type ModalInfo = {
  show: boolean;
  message: string;
  type: "alert" | "confirm";
  onConfirm?: () => void;
};

export default function StorePage() {
  // --- State ---
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const [modal, setModal] = useState<ModalInfo>({
    show: false,
    message: "",
    type: "alert",
  });

  const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api").replace(
    /\/*$/,
    ""
  );

  // --- Auth Check & Data Loading ---
  useEffect(() => {
    let rawCustomer: string | null = null;
    try {
      rawCustomer = localStorage.getItem("customer");
    } catch (err) {
      // Fails in environments where localStorage is blocked
      router.replace("/login");
      return;
    }

    // 1. Auth Guard: Check if user is logged in
    if (!rawCustomer) {
      router.replace("/login");
      return;
    }

    try {
      const parsedCustomer = JSON.parse(rawCustomer) as Customer;
      setCustomer(parsedCustomer);
    } catch (err) {
      // Data was corrupted, clear it
      localStorage.removeItem("customer");
      router.replace("/login");
      return;
    }

    // 2. Load Products
    loadProducts();
    setIsLoading(false);
  }, [router, API_BASE]);

  // --- Data Functions ---
  const loadProducts = async () => {
    try {
      const res = await fetch(`${API_BASE}/products`);
      if (!res.ok) throw new Error("Failed to fetch products");
      const data = await res.json();
      setProducts(data);
    } catch (err: any) {
      setModal({
        show: true,
        message: err.message || "Could not load products.",
        type: "alert",
      });
    }
  };

  // --- Customer Function ---
  const handleAddToCart = async (productId: number) => {
    if (!customer) {
      setModal({ show: true, message: "You must be logged in.", type: "alert" });
      return;
    }

    // ---
    // API endpoint for cart added here.
    // need to create 'POST /api/cart/add' in your backend project. Soon
    // ---
    try {
      const res = await fetch(`${API_BASE}/cart/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: customer.customerid,
          productId: productId,
          quantity: 1, // Default to adding 1
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to add to cart");
      }

      setModal({ show: true, message: "Product added to cart!", type: "alert" });
    } catch (err: any) {
      setModal({ show: true, message: err.message, type: "alert" });
    }
  };

  // --- Render ---
  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-slate-600">Loading Store...</p>
      </main>
    );
  }

  return (
    <>
      <main className="min-h-screen bg-slate-50 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-slate-900 mb-6">Store</h1>
          {products.length === 0 ? (
            <p className="text-slate-600">No products found.</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((p) => (
                <div
                  key={p.id}
                  className="bg-white rounded-xl shadow-md p-5 border border-slate-200 flex flex-col"
                >
                  <div className="flex-grow mb-4">
                    <h2 className="text-lg font-semibold text-slate-900">{p.name}</h2>
                    <p className="text-slate-700 font-medium">
                      ${Number(p.price).toFixed(2)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleAddToCart(p.id)}
                    className="w-full bg-blue-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-blue-700 transition"
                  >
                    Add to Cart
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Re-usable Modal */}
      <CustomModal
        show={modal.show}
        message={modal.message}
        type={modal.type}
        onClose={() => setModal({ ...modal, show: false })}
        onConfirm={modal.onConfirm}
      />
    </>
  );
}

// --- Re-usable Modal Component ---
function CustomModal({
  show,
  message,
  type,
  onClose,
  onConfirm,
}: {
  show: boolean;
  message: string;
  type: "alert" | "confirm";
  onClose: () => void;
  onConfirm?: () => void;
}) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 shadow-xl max-w-sm w-full">
        <h3 className="text-lg font-medium text-slate-900 mb-4">
          {type === "confirm" ? "Confirmation" : "Notification"}
        </h3>
        <p className="text-sm text-slate-600 mb-6">{message}</p>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className={`w-full py-2 rounded-lg ${
              type === "alert"
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-slate-200 text-slate-700 hover:bg-slate-300"
            }`}
          >
            {type === "alert" ? "OK" : "Cancel"}
          </button>
          {type === "confirm" && (
            <button
              onClick={() => {
                onConfirm?.();
                onClose();
              }}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
            >
              Confirm
            </button>
          )}
        </div>
      </div>
    </div>
  );
}