"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";

export default function ProductsPage() {
  const router = useRouter();

  const [products, setProducts] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");

  const [loading, setLoading] = useState(true);

  // Admin check
  useEffect(() => {
    const stored = localStorage.getItem("customer");
    if (!stored) {
      router.push("/login");
      return;
    }

    const user = JSON.parse(stored);

    if (!user.isAdmin) {
      router.push("/"); // redirect normal customers
      return;
    }

    setLoading(false);
    loadProducts();
  }, []);

  // Load products
  const loadProducts = async () => {
    const res = await fetch("http://localhost:4000/api/products");
    const data = await res.json();
    setProducts(data);
  };

  // Delete
  const handleDelete = async (id: number) => {
    if (!confirm("Delete this product?")) return;
    const res = await fetch(`http://localhost:4000/api/products/${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      loadProducts();
    } else alert("Delete failed");
  };

  // Edit mode
  const handleEdit = (p: any) => {
    setEditingId(p.id);
    setEditName(p.name);
    setEditPrice(p.price);
  };

  // Save updates
  const handleSave = async (id: number) => {
    const res = await fetch(`http://localhost:4000/api/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName, price: Number(editPrice) }),
    });
    if (res.ok) {
      setEditingId(null);
      loadProducts();
    } else alert("Update failed");
  };

  // Avoid flickering unauthorized content
  if (loading) {
    return <p className="p-8 text-center text-slate-600">Loading…</p>;
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4">
      <div className="pb-2">
        <Header />
      </div>

      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow p-6">
        <h1 className="text-2xl font-bold mb-6 text-slate-900">
          Product Management (Admin Only)
        </h1>

        {products.length === 0 ? (
          <p className="text-slate-600">No products found.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-xl shadow-md p-5 border border-slate-200"
              >
                {editingId === p.id ? (
                  <div className="space-y-3">
                    <input
                      className="border border-slate-300 rounded-lg p-2 w-full text-black"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                    />

                    <input
                      className="border border-slate-300 rounded-lg p-2 w-full text-black"
                      type="number"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                    />

                    <div className="flex gap-2">
                      <button
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                        onClick={() => handleSave(p.id)}
                      >
                        Save
                      </button>

                      <button
                        className="bg-slate-400 text-white px-4 py-2 rounded-lg hover:bg-slate-500"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <h2 className="text-lg font-semibold text-slate-900">
                      {p.name}
                    </h2>
                    <p className="text-slate-700 font-medium">${p.price}</p>

                    <div className="flex gap-2 pt-2">
                      <button
                        className="bg-yellow-500 text-white px-3 py-1.5 rounded-lg hover:bg-yellow-600"
                        onClick={() => handleEdit(p)}
                      >
                        Edit
                      </button>

                      <button
                        className="bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700"
                        onClick={() => handleDelete(p.id)}
                      >
                        Delete
                      </button>
                    </div>
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
