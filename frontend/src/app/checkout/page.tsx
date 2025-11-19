"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Customer = {
  customerId: number;
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
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  
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

    fetch(`${API_BASE}/cart/${parsedCustomer.customerId}`)
      .then((res) => res.json())
      .then((data: CartItem[]) => {
        setCartItems(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load cart", err);
        setLoading(false);
      });
  }, [router, API_BASE]);

  const updateCartItemQuantity = (productId: number, newQuantity: number) => {
    setCartItems(prev => {
      // If new quantity is 0, remove the item
      if (newQuantity === 0) {
        return prev.filter(item => item.productid !== productId);
      }
      // Otherwise, update the quantity and total
      return prev.map(item => {
        if (item.productid === productId) {
          // Recalculate total_price based on the single item price
          return {
            ...item,
            quantity: newQuantity,
            total_price: item.price * newQuantity,
          };
        }
        return item;
      });
    });
  };

  //Increase Quantity
  const handleIncreaseQuantity = async (productId: number) => {
    if (!customer) return;

    const item = cartItems.find(i => i.productid === productId);
    if (!item) return;

    const oldCart = cartItems;
    updateCartItemQuantity(productId, item.quantity + 1);

    try {
      const res = await fetch(`${API_BASE}/cart/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: customer.customerid,
          productId: productId,
          quantity: 1, // Add 1
        }),
      });
      if (!res.ok) {
        setCartItems(oldCart); // Revert on failure
        alert("Failed to update item.");
      }
    } catch (err) {
      setCartItems(oldCart);
      alert("Error updating item.");
    }
  };

  // Decrease Quantity 
  const handleDecreaseQuantity = async (productId: number) => {
    if (!customer) return;

    const item = cartItems.find(i => i.productid === productId);
    if (!item) return;

    const oldCart = cartItems;
    updateCartItemQuantity(productId, item.quantity - 1);

    try {
      // calls the POST /decrease route in cart.ts
      const res = await fetch(`${API_BASE}/cart/decrease`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: customer.customerid,
          productId: productId,
        }),
      });

      if (!res.ok) {
        setCartItems(oldCart); // Revert on failure
        alert("Failed to update item.");
      }
    } catch (err) {
      setCartItems(oldCart);
      alert("Error updating item.");
    }
  };

  // Calculate Total from state 
  const cartTotal = cartItems.reduce((sum, item) => sum + Number(item.total_price), 0);

  // Handle Order Placement
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`${API_BASE}/orders/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: customer.customerId,
          shippingaddress: address,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to place order");
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
          
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">Review Your Items</h2>
            <div className="space-y-4">
              {cartItems.length > 0 ? (
                cartItems.map(item => (
                  <div key={item.productid} className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-slate-800">{item.name}</h3>
                      <p className="text-sm text-slate-500">
                        ${Number(item.price).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* --- Quantity Controls --- */}
                      <button 
                        onClick={() => handleDecreaseQuantity(item.productid)}
                        className="w-7 h-7 flex items-center justify-center bg-slate-100 rounded-full text-lg text-slate-600 hover:bg-slate-200"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-medium text-slate-700">
                        {item.quantity}
                      </span>
                      <button 
                        onClick={() => handleIncreaseQuantity(item.productid)}
                        className="w-7 h-7 flex items-center justify-center bg-slate-100 rounded-full text-lg text-slate-600 hover:bg-slate-200"
                      >
                        +
                      </button>
                      {/* --- End Controls --- */}
                      <span className="font-medium text-slate-700 w-20 text-right">
                        ${Number(item.total_price).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 text-center">Your cart is empty.</p>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="mb-8 pb-8 border-y border-slate-100 py-8">
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
