"use client";

import { useEffect, useState } from "react";
import EscrowCard, { EscrowProps } from "./EscrowCard";
import { Loader2 } from "lucide-react";

export default function EscrowList({ userAddress }: { userAddress: string }) {
    const [escrows, setEscrows] = useState<Omit<EscrowProps, "userAddress" | "onUpdate">[]>([]);
    const [loading, setLoading] = useState(false);

    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Real Data Loading
    useEffect(() => {
        if (!userAddress) return;

        let isMounted = true;

        const fetchEscrows = async () => {
            setLoading(true);
            try {
                // ... fetch logic ...
                // 1. Get IDs
                const { getUserEscrows, getEscrow } = await import("@/utils/soroban");
                const ids = await getUserEscrows(userAddress);
                console.log("User Escrow IDs:", ids);

                if (!ids || ids.length === 0) {
                    if (isMounted) {
                        setEscrows([]);
                        setLoading(false);
                    }
                    return;
                }

                // 2. Fetch details for each (in parallel)
                const promises = (ids as Array<string | number>).map(async (id) => {
                    const details = await getEscrow(id.toString(), userAddress);
                    if (!details) return null;

                    // Parse the Map from soroban (array of {key, val})
                    // With scValToNative, details is now an Object
                    const escrowData = details as Record<string, unknown>;
                    const getField = (key: string) => escrowData[key];

                    // State Mapping (Enum): Funded=0, Released=1, Cancelled=2, Disputed=3, Resolved=4
                    const stateEnum = getField("state");
                    const states = ["Funded", "Released", "Cancelled", "Disputed", "Resolved"];
                    const stateStr = states[Number(stateEnum)] || "Unknown";

                    return {
                        id: id.toString(),
                        client: getField("client")?.toString() ?? "",
                        freelancer: getField("freelancer")?.toString() ?? "",
                        arbiter: getField("arbiter")?.toString(),
                        amount: getField("amount")?.toString() ?? "0",
                        state: stateStr as EscrowProps["state"],
                        approvedByClient: Boolean(getField("approved_by_client")),
                        approvedByFreelancer: Boolean(getField("approved_by_freelancer")),
                    };
                });

                const results = await Promise.all(promises);
                if (isMounted) {
                    // Sort by ID descending (newest first)
                    const sorted = results.filter((r): r is NonNullable<typeof r> => r !== null).sort((a, b) => Number(b.id) - Number(a.id));
                    setEscrows(sorted);
                }

            } catch (err) {
                console.error("Failed to fetch escrows", err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchEscrows();

        return () => { isMounted = false; };
    }, [userAddress, refreshTrigger]); // Add refreshTrigger dependency

    const refresh = () => {
        setRefreshTrigger(prev => prev + 1);
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
