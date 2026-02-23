import React, { useState } from "react";
import axios from "axios";

const Checkout = ({ project, currentUser }) => {
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState(project?.price || 10);
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async () => {
    // Validate phone number - must start with 254 and be at least 12 digits
    if (!phone || phone.length < 12 || !phone.startsWith("254")) {
      alert("Please enter a valid Safaricom phone number in the format 2547XXXXXXXX");
      return;
    }

    if (!amount || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    setIsProcessing(true);

    try {
      const res = await axios.post("/api/mpesa/stk-push/", {
        phone_number: phone,
        amount: parseFloat(amount),
        account_reference: project?.id?.toString() || "DEV001",
        transaction: `Purchase of ${project?.title || "DevSoko Item"}`
      });

      alert("STK Push Sent! Check your phone to complete payment.");
      console.log("Payment response:", res.data);
      
      // Optionally save the sale after successful STK push
      if (res.data.checkout_request_id) {
        saveSale(res.data.checkout_request_id);
      }
    } catch (err) {
      console.error("Payment error:", err);
      const errorMessage = err.response?.data?.detail || err.response?.data?.error || "Something went wrong during payment. Try again.";
      alert(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };


  // In your Checkout.jsx (after successful "payment")
const saveSale = () => {
  const sales = JSON.parse(localStorage.getItem('sales')) || [];

  const newSale = {
    projectId: project.id,
    projectTitle: project.title,
    buyerEmail: currentUser.email,
    sellerEmail: project.sellerEmail,
    date: new Date().toLocaleString(),
    amount: project.price
  };

  sales.push(newSale);
  localStorage.setItem('sales', JSON.stringify(sales));
};

  
  return (
    <div className="max-w-md mx-auto mt-10 bg-white shadow-xl rounded-xl p-6">
      <h2 className="text-2xl font-bold mb-4 text-center">DevSoko Checkout</h2>

      <label className="block mb-2 font-medium text-gray-700">Phone Number (Format: 2547XXXXXXXX)</label>
      <input
        type="text"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="254712345678"
        className="w-full p-2 border border-gray-300 rounded mb-4"
      />

      <label className="block mb-2 font-medium text-gray-700">Amount</label>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Enter amount"
        className="w-full p-2 border border-gray-300 rounded mb-4"
      />

      <button
        onClick={handlePayment}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
      >
        Pay with M-Pesa
      </button>
    </div>
  );
};

export default Checkout;
