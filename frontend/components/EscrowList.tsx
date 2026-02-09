"use client";

import { useEffect, useState } from "react";
import EscrowCard, { EscrowProps, EscrowState } from "./EscrowCard";
import { Loader2 } from "lucide-react";

export default function EscrowList({ userAddress }: { userAddress: string }) {
    const [escrows, setEscrows] = useState<Omit<EscrowProps, "userAddress" | "onUpdate">[]>([]);
    const [loading, setLoading] = useState(false);

    // Simulation loader
    useEffect(() => {
        if (!userAddress) return;

        setLoading(true);
        // Simulate network delay
        setTimeout(() => {
            setEscrows([
                {
                    id: "101",
                    client: "GB6...CLIENT",
                    freelancer: userAddress,
                    amount: "500",
                    state: "Funded",
                    approvedByClient: true,
                    approvedByFreelancer: false,
                },
                {
                    id: "102",
                    client: userAddress,
                    freelancer: "GDX...FREELANCER",
                    amount: "1200",
                    state: "Released",
                    approvedByClient: true,
                    approvedByFreelancer: true,
                },
                {
                    id: "103",
                    client: "GA7...WEBSITE",
                    freelancer: userAddress,
                    amount: "2500",
                    state: "Funded",
                    approvedByClient: false,
                    approvedByFreelancer: true,
                },
                {
                    id: "104",
                    client: userAddress,
                    freelancer: "GC2...LOGO",
                    amount: "150",
                    state: "Funded",
                    approvedByClient: false,
                    approvedByFreelancer: false,
                }
            ]);
            setLoading(false);
        }, 1000);
    }, [userAddress]);

    const refresh = () => {
        // In real app, re-fetch from Soroban
        alert("Refreshing data... (Simulation)");
    };

    if (!userAddress) return null;

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-black uppercase flex items-center gap-3">
                    <span className="bg-yellow-400 border-2 border-black px-3 py-1 text-lg transform -rotate-2 shadow-[2px_2px_0px_0px_black]">Active Goals</span>
                </h2>
                <button onClick={refresh} className="font-bold underline uppercase hover:text-blue-600">
                    Refresh
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin w-10 h-10 text-black" />
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-8">
                    {escrows.map((escrow) => (
                        <EscrowCard
                            key={escrow.id}
                            {...escrow}
                            userAddress={userAddress}
                            onUpdate={refresh}
                        />
                    ))}
                    {escrows.length === 0 && (
                        <div className="py-20 text-center border-4 border-dashed border-gray-300">
                            <p className="font-mono text-xl text-gray-400 uppercase font-bold">No active escrows</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
