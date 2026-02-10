"use client";

import { useEffect, useState } from "react";
import EscrowCard, { EscrowProps, EscrowState } from "./EscrowCard";
import { Loader2, Filter } from "lucide-react";

type FilterOption = "All" | "Active" | "Completed" | "Disputed";

const FILTER_CONFIG: Record<FilterOption, { states: EscrowState[]; bg: string }> = {
    All: { states: ["Funded", "Released", "Cancelled", "Disputed", "Resolved"], bg: "bg-black text-white" },
    Active: { states: ["Funded"], bg: "bg-yellow-400" },
    Completed: { states: ["Released", "Cancelled", "Resolved"], bg: "bg-green-400" },
    Disputed: { states: ["Disputed"], bg: "bg-orange-400" },
};

interface EscrowListProps {
    userAddress: string;
    refreshKey?: number;
}

export default function EscrowList({ userAddress, refreshKey = 0 }: EscrowListProps) {
    const [escrows, setEscrows] = useState<Omit<EscrowProps, "userAddress" | "onUpdate">[]>([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState<FilterOption>("All");
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Real Data Loading
    useEffect(() => {
        if (!userAddress) return;

        let isMounted = true;

        const fetchEscrows = async () => {
            setLoading(true);
            try {
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

                const promises = (ids as Array<string | number>).map(async (id) => {
                    const details = await getEscrow(id.toString(), userAddress);
                    if (!details) return null;

                    const escrowData = details as Record<string, unknown>;
                    const getField = (key: string) => escrowData[key];

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
                        deadline: getField("deadline")?.toString(),
                    };
                });

                const results = await Promise.all(promises);
                if (isMounted) {
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
    }, [userAddress, refreshTrigger, refreshKey]);

    const refresh = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    const filteredEscrows = escrows.filter(e => FILTER_CONFIG[filter].states.includes(e.state));

    if (!userAddress) return null;

    return (
        <div className="space-y-6">
            {/* Title + Refresh */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <h2 className="text-3xl font-black uppercase flex items-center gap-3">
                    <span className="bg-yellow-400 border-2 border-black px-3 py-1 text-lg transform -rotate-2 shadow-[2px_2px_0px_0px_black]">Your Escrows</span>
                </h2>
                <button onClick={refresh} className="font-bold underline uppercase hover:text-blue-600 text-sm">
                    Refresh
                </button>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap gap-2 items-center">
                <Filter size={16} className="text-gray-500" />
                {(Object.keys(FILTER_CONFIG) as FilterOption[]).map((key) => (
                    <button
                        key={key}
                        onClick={() => setFilter(key)}
                        className={`px-3 py-1 text-xs font-black uppercase border-2 border-black transition-all
                            ${filter === key
                                ? `${FILTER_CONFIG[key].bg} shadow-[2px_2px_0px_0px_black]`
                                : "bg-white hover:bg-gray-100"
                            }`}
                    >
                        {key}
                        {key !== "All" && (
                            <span className="ml-1 opacity-60">
                                ({escrows.filter(e => FILTER_CONFIG[key].states.includes(e.state)).length})
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin w-10 h-10 text-black" />
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {filteredEscrows.map((escrow) => (
                        <EscrowCard
                            key={escrow.id}
                            {...escrow}
                            userAddress={userAddress}
                            onUpdate={refresh}
                        />
                    ))}
                    {filteredEscrows.length === 0 && (
                        <div className="py-16 text-center border-4 border-dashed border-gray-300">
                            <p className="font-mono text-lg text-gray-400 uppercase font-bold">
                                {escrows.length === 0 ? "No escrows yet" : `No ${filter.toLowerCase()} escrows`}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
