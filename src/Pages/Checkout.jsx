import React, { useState, useEffect } from "react";
import axios from "axios";

const Checkout = ({ project, currentUser }) => {
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState(project?.price || 10);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ngrokUrl, setNgrokUrl] = useState("");
  const [callbackSet, setCallbackSet] = useState(false);

  // Check current callback URL on mount
  useEffect(() => {
    axios.get("/api/mpesa/get-ngrok-url/")
      .then(res => {
        if (res.data.current_callback_url) {
          setCallbackSet(true);
        }
      })
      .catch(err => console.log("Could not get callback URL status"));
  }, []);

  const handleSetCallbackUrl = async () => {
    if (!ngrokUrl) {
      alert("Please enter your ngrok URL");
      return;
    }
    
    // Ensure URL ends with /
    const formattedUrl = ngrokUrl.endsWith('/') ? ngrokUrl : ngrokUrl + '/';
    const callbackUrl = `${formattedUrl}api/mpesa/callback/`;
    
    try {
      await axios.post("/api/mpesa/set-callback-url/", {
        callback_url: callbackUrl
      });
      setCallbackSet(true);
      alert("Callback URL configured successfully!");
    } catch (err) {
      alert("Failed to set callback URL");
    }
  };

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
        saveSale();
      }
    } catch (err) {
      console.error("Payment error:", err);
      const errorMessage = err.response?.data?.detail || err.response?.data?.error || "Something went wrong during payment. Try again.";
      alert(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };


  // Save sale after successful payment
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

      {/* Ngrok URL Configuration */}
      {!callbackSet && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-bold text-yellow-800 mb-2">⚠️ Setup Required</h3>
          <p className="text-sm text-yellow-700 mb-3">
            For M-Pesa to work, you need a public URL. 
            <br/>1. Start ngrok: <code>ngrok http 8000</code>
            <br/>2. Copy your HTTPS URL (e.g., https://abc123.ngrok.io)
            <br/>3. Paste it below
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={ngrokUrl}
              onChange={(e) => setNgrokUrl(e.target.value)}
              placeholder="https://abc123.ngrok.io"
              className="flex-1 p-2 border border-yellow-300 rounded text-sm"
            />
            <button
              onClick={handleSetCallbackUrl}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-2 rounded text-sm"
            >
              Set
            </button>
          </div>
        </div>
      )}

      {callbackSet && (
        <div className="mb-4 p-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          ✓ M-Pesa callback URL configured
        </div>
      )}

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
        disabled={isProcessing || !callbackSet}
        className={`w-full font-bold py-2 px-4 rounded ${isProcessing || !callbackSet ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white'}`}
      >
        {isProcessing ? "Processing..." : "Pay with M-Pesa"}
      </button>
    </div>
  );
};

export default Checkout;
