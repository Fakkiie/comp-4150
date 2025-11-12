"use client";
import { useEffect, useState } from "react";

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");

  // Load products from backend
  const loadProducts = async () => {
    const res = await fetch("http://localhost:4000/api/products");
    const data = await res.json();
    setProducts(data);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // Delete product
  const handleDelete = async (id: number) => {
    if (!confirm("Delete this product?")) return;
    const res = await fetch(`http://localhost:4000/api/products/${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      alert("🗑️ Product deleted");
      loadProducts();
    } else alert("❌ Delete failed");
  };

  // Start editing mode
  const handleEdit = (p: any) => {
    setEditingId(p.id);
    setEditName(p.name);
    setEditPrice(p.price);
  };

  // Save edited product
  const handleSave = async (id: number) => {
    const res = await fetch(`http://localhost:4000/api/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName, price: Number(editPrice) }),
    });
    if (res.ok) {
      alert("✅ Product updated");
      setEditingId(null);
      loadProducts();
    } else alert("❌ Update failed");
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-4">Product Catalog</h1>

      <ul className="space-y-3">
        {products.map((p) => (
          <li
            key={p.id}
            className="border p-3 rounded flex items-center justify-between"
          >
            {editingId === p.id ? (
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <input
                  className="border p-1"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
                <input
                  className="border p-1 w-24"
                  type="number"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                />
                <button
                  className="bg-green-600 text-white px-2 py-1 rounded"
                  onClick={() => handleSave(p.id)}
                >
                  Save
                </button>
                <button
                  className="bg-gray-400 text-white px-2 py-1 rounded"
                  onClick={() => setEditingId(null)}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex justify-between w-full">
                <span>
                  {p.name} — ${p.price}
                </span>
                <div className="flex gap-2">
                  <button
                    className="bg-yellow-500 text-white px-2 py-1 rounded"
                    onClick={() => handleEdit(p)}
                  >
                    Edit
                  </button>
                  <button
                    className="bg-red-600 text-white px-2 py-1 rounded"
                    onClick={() => handleDelete(p.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

