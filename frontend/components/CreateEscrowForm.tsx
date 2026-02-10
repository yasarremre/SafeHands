"use client";

import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { deposit } from "@/utils/soroban";

export default function CreateEscrowForm({
    clientAddress,
}: {
    clientAddress: string;
}) {
    const [freelancer, setFreelancer] = useState("");
    const [arbiter, setArbiter] = useState("");
    const [amount, setAmount] = useState("");
    const [loading, setLoading] = useState(false);

    const handleDeposit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!clientAddress) return alert("Connect wallet first!");

        setLoading(true);
        try {
            // Default arbiter to client if empty
            const arbiterAddr = arbiter || clientAddress;
            await deposit(clientAddress, freelancer, arbiterAddr, amount);
            alert("Escrow created successfully!");
            setFreelancer("");
            setArbiter("");
            setAmount("");
        } catch (err: unknown) {
            console.error(err);
            const message = err instanceof Error ? err.message : String(err);
            alert(`Failed to create escrow: ${message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white brutalist-border brutalist-shadow p-8">
            <h2 className="text-3xl font-black mb-8 uppercase flex items-center gap-3">
                <div className="bg-black text-white p-1"><Plus size={24} /></div>
                New Job
            </h2>

            <form onSubmit={handleDeposit} className="space-y-6">
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="font-black uppercase text-sm">Freelancer Address (G...)</label>
                        <button
                            type="button"
                            onClick={() => setFreelancer(clientAddress)}
                            className="text-xs underline text-blue-600 hover:text-blue-800"
                        >
                            Use My Address (Self-Test)
                        </button>
                    </div>
                    <input
                        type="text"
                        value={freelancer}
                        onChange={(e) => setFreelancer(e.target.value)}
                        className="w-full bg-white border-2 border-black p-4 font-mono focus:outline-none focus:ring-4 focus:ring-yellow-400 transition-all placeholder:text-gray-400"
                        placeholder="G..."
                        required
                        pattern="G[A-Z0-9]{55}"
                        title="Must be a valid Stellar Public Key starting with 'G' (56 chars)"
                    />
                </div>

                <div>
                    <label className="block font-black mb-2 uppercase text-sm">Arbiter Address (Optional)</label>
                    <input
                        type="text"
                        value={arbiter}
                        onChange={(e) => setArbiter(e.target.value)}
                        className="w-full bg-white border-2 border-black p-4 font-mono focus:outline-none focus:ring-4 focus:ring-yellow-400 transition-all placeholder:text-gray-400"
                        placeholder="G... (Defaults to Self/Client if empty)"
                    />
                </div>

                <div>
                    <label className="block font-black mb-2 uppercase text-sm">Amount (XLM)</label>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full bg-white border-2 border-black p-4 font-mono focus:outline-none focus:ring-4 focus:ring-yellow-400 transition-all placeholder:text-gray-400"
                        placeholder="100"
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading || !clientAddress}
                    className="w-full bg-black text-white font-black py-5 uppercase tracking-widest hover:bg-gray-900 disabled:bg-gray-400 disabled:cursor-not-allowed border-2 border-black brutalist-shadow active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all"
                >
                    {loading ? (
                        <span className="flex items-center justify-center gap-2">
                            <Loader2 className="animate-spin" /> In Progress...
                        </span>
                    ) : (
                        "Lock Funds Now"
                    )}
                </button>
            </form>
        </div>
    );
}
