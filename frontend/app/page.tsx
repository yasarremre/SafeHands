"use client";

import { useState } from "react";
import CreateEscrowForm from "@/components/CreateEscrowForm";
import EscrowList from "@/components/EscrowList";
import FreighterConnect from "@/components/FreighterConnect";
import { ShieldCheck } from "lucide-react";

export default function Home() {
  const [userAddress, setUserAddress] = useState<string>("");

  return (
    <main className="min-h-screen bg-[#F0F0F0] text-black font-sans selection:bg-yellow-200">
      {/* Header */}
      <header className="border-b-4 border-black bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-black text-white p-2 rounded-lg">
              <ShieldCheck size={32} />
            </div>
            <h1 className="text-3xl font-black tracking-tighter uppercase italic">
              Freelance <span className="text-blue-600">Safe-Hands</span>
            </h1>
          </div>
          <FreighterConnect onConnect={setUserAddress} />
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        {!userAddress ? (
          <div className="text-center py-20">
            <h2 className="text-4xl font-black mb-6 uppercase">
              Secure Your Work with <span className="underline decoration-4 decoration-blue-500">Trustless Escrow</span>
            </h2>
            <p className="text-xl font-mono text-gray-600 max-w-2xl mx-auto mb-12">
              The minimalist protocol for freelancers and clients.
              Deposit funds, lock them, and release only when the job is done.
              Powered by Stellar Soroban.
            </p>
            <div className="inline-block border-4 border-black p-4 bg-yellow-300 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rotate-[-2deg]">
              <p className="font-bold text-lg uppercase">Connect your Freighter Wallet to start</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Left Column: Create Logic */}
            <div className="lg:col-span-5">
              <CreateEscrowForm clientAddress={userAddress} />

              <div className="mt-8 bg-blue-100 border-2 border-blue-500 p-6 rounded-lg text-blue-900">
                <h3 className="font-bold uppercase mb-2 flex items-center gap-2">
                  <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">i</span>
                  How it works
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-sm font-mono">
                  <li>Client deposits XLM for a Freelancer.</li>
                  <li>Funds are locked in the Smart Contract.</li>
                  <li>Both parties must approve to release funds.</li>
                </ol>
              </div>
            </div>

            {/* Right Column: List */}
            <div className="lg:col-span-7">
              <EscrowList userAddress={userAddress} />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t-4 border-black bg-white py-8 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="font-mono text-sm text-gray-500">
            Built on <a href="https://stellar.org/soroban" target="_blank" className="underline font-bold text-black">Stellar Soroban Testnet</a>
          </p>
          <p className="font-black text-xs uppercase mt-2 opacity-50">
            Safe-Hands Protocol v0.1.0
          </p>
        </div>
      </footer>
    </main>
  );
}
