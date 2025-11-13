"use client";
import { useEffect, useState } from "react";

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");

  // Load products
  const loadProducts = async () => {
    const res = await fetch("http://localhost:4000/api/products");
    const data = await res.json();
    setProducts(data);
  };

  useEffect(() => {
    loadProducts();
  }, []);

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

  // Edit
  const handleEdit = (p: any) => {
    setEditingId(p.id);
    setEditName(p.name);
    setEditPrice(p.price);
  };

  // Save
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

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow p-6">
        <h1 className="text-2xl font-bold mb-6">Product Management</h1>

        {products.length === 0 ? (
          <p className="text-slate-500">No products found.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <div key={p.id} className="border rounded-xl p-4">
                {editingId === p.id ? (
                  <div className="space-y-2">
                    <input
                      className="border p-2 rounded w-full"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                    />
                    <input
                      className="border p-2 rounded w-full"
                      type="number"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <button
                        className="bg-green-600 text-white px-3 py-1 rounded"
                        onClick={() => handleSave(p.id)}
                      >
                        Save
                      </button>
                      <button
                        className="bg-gray-400 text-white px-3 py-1 rounded"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h2 className="font-medium">{p.name}</h2>
                    <p className="text-slate-600">${p.price}</p>
                    <div className="flex gap-2 mt-3">
                      <button
                        className="bg-yellow-500 text-white px-3 py-1 rounded"
                        onClick={() => handleEdit(p)}
                      >
                        Edit
                      </button>
                      <button
                        className="bg-red-600 text-white px-3 py-1 rounded"
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
