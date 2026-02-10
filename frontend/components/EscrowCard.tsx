"use client";

import { CheckCircle, ShieldCheck, AlertTriangle, XCircle, Scale, Ban } from "lucide-react";
import { approve, cancel, dispute, resolve } from "@/utils/soroban";
import { useState } from "react";

export type EscrowState = "Funded" | "Released" | "Cancelled" | "Disputed" | "Resolved";

export interface EscrowProps {
    id: string;
    client: string;
    freelancer: string;
    arbiter?: string;
    amount: string;
    state: EscrowState;
    approvedByClient: boolean;
    approvedByFreelancer: boolean;
    userAddress: string;
    onUpdate: () => void;
}

const STATE_CONFIG: Record<EscrowState, { bg: string; icon: React.ReactNode; label: string }> = {
    Funded: { bg: "bg-yellow-400", icon: <AlertTriangle size={16} />, label: "Funded" },
    Released: { bg: "bg-green-400", icon: <CheckCircle size={16} />, label: "Released" },
    Cancelled: { bg: "bg-red-300", icon: <Ban size={16} />, label: "Cancelled" },
    Disputed: { bg: "bg-orange-400", icon: <Scale size={16} />, label: "Disputed" },
    Resolved: { bg: "bg-blue-300", icon: <ShieldCheck size={16} />, label: "Resolved" },
};

export default function EscrowCard({
    id,
    client,
    freelancer,
    arbiter,
    amount,
    state,
    approvedByClient,
    approvedByFreelancer,
    userAddress,
    onUpdate,
}: EscrowProps) {
    const [loading, setLoading] = useState(false);
    const [resolveWinner, setResolveWinner] = useState("");
    const isClient = userAddress === client;
    const isFreelancer = userAddress === freelancer;
    const isArbiter = arbiter ? userAddress === arbiter : false;

    const canApprove =
        state === "Funded" &&
        ((isClient && !approvedByClient) || (isFreelancer && !approvedByFreelancer));

    const canCancel =
        state === "Funded" && isClient && !approvedByFreelancer;

    const canDispute =
        state === "Funded" && (isClient || isFreelancer);

    const canResolve =
        state === "Disputed" && isArbiter;

    const stateConfig = STATE_CONFIG[state] || STATE_CONFIG.Funded;

    const handleAction = async (action: () => Promise<unknown>, successMsg: string) => {
        setLoading(true);
        try {
            await action();
            alert(successMsg);
            onUpdate();
        } catch (e: unknown) {
            console.error(e);
            const message = e instanceof Error ? e.message : "Unknown error";
            alert(`Action failed: ${message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white brutalist-border brutalist-shadow p-6 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">
            {/* Header */}
            <div className="flex justify-between items-start mb-6 border-b-2 border-black pb-4">
                <div>
                    <h3 className="text-2xl font-black font-mono">#{id}</h3>
                    <div className={`mt-2 inline-flex items-center gap-2 px-3 py-1 text-sm font-bold uppercase border-2 text-black ${stateConfig.bg} border-black`}>
                        {stateConfig.icon}
                        {stateConfig.label}
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-3xl font-black">{amount} XLM</div>
                    <div className="text-xs font-bold uppercase tracking-widest text-gray-500">
                        {state === "Released" ? "Released" : state === "Cancelled" ? "Refunded" : "Locked"}
                    </div>
                </div>
            </div>

            {/* Details */}
            <div className="space-y-4 mb-6 text-sm font-mono">
                <div className="flex flex-col">
                    <span className="font-bold uppercase text-xs text-gray-500">Client</span>
                    <span className="break-all bg-gray-100 p-2 border border-black">{client}</span>
                </div>
                <div className="flex flex-col">
                    <span className="font-bold uppercase text-xs text-gray-500">Freelancer</span>
                    <span className="break-all bg-gray-100 p-2 border border-black">{freelancer}</span>
                </div>
                {arbiter && arbiter !== client && (
                    <div className="flex flex-col">
                        <span className="font-bold uppercase text-xs text-gray-500">Arbiter</span>
                        <span className="break-all bg-gray-100 p-2 border border-black">{arbiter}</span>
                    </div>
                )}
            </div>

            {/* Approval Status */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className={`p-3 border-2 border-black text-center ${approvedByClient ? 'bg-green-200' : 'bg-gray-100 opacity-50'}`}>
                    <span className="block font-bold uppercase text-xs mb-1">Client Approval</span>
                    {approvedByClient ? "✅ YES" : "⏳ PENDING"}
                </div>
                <div className={`p-3 border-2 border-black text-center ${approvedByFreelancer ? 'bg-green-200' : 'bg-gray-100 opacity-50'}`}>
                    <span className="block font-bold uppercase text-xs mb-1">Freelancer Approval</span>
                    {approvedByFreelancer ? "✅ YES" : "⏳ PENDING"}
                </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
                {canApprove && (
                    <button
                        onClick={() => handleAction(() => approve(userAddress, id), "Approved successfully!")}
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-4 font-black uppercase tracking-widest hover:bg-blue-700 disabled:bg-gray-400 border-2 border-black brutalist-shadow active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? "Processing..." : (
                            <>
                                <ShieldCheck size={20} /> Approve Release
                            </>
                        )}
                    </button>
                )}

                {canCancel && (
                    <button
                        onClick={() => handleAction(() => cancel(userAddress, id), "Escrow cancelled and refunded!")}
                        disabled={loading}
                        className="w-full bg-red-500 text-white py-3 font-black uppercase tracking-widest hover:bg-red-600 disabled:bg-gray-400 border-2 border-black brutalist-shadow active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? "Processing..." : (
                            <>
                                <XCircle size={20} /> Cancel & Refund
                            </>
                        )}
                    </button>
                )}

                {canDispute && (
                    <button
                        onClick={() => handleAction(() => dispute(userAddress, id), "Dispute raised!")}
                        disabled={loading}
                        className="w-full bg-orange-500 text-white py-3 font-black uppercase tracking-widest hover:bg-orange-600 disabled:bg-gray-400 border-2 border-black brutalist-shadow active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? "Processing..." : (
                            <>
                                <Scale size={20} /> Raise Dispute
                            </>
                        )}
                    </button>
                )}

                {canResolve && (
                    <div className="border-2 border-black p-4 bg-blue-50">
                        <h4 className="font-black uppercase text-sm mb-3">Resolve Dispute</h4>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Winner Address (G...)"
                                value={resolveWinner}
                                onChange={(e) => setResolveWinner(e.target.value)}
                                className="flex-1 border-2 border-black p-2 font-mono text-sm"
                            />
                            <button
                                onClick={() => handleAction(() => resolve(userAddress, id, resolveWinner), "Dispute resolved!")}
                                disabled={loading || !resolveWinner}
                                className="bg-blue-600 text-white px-4 py-2 font-bold uppercase border-2 border-black hover:bg-blue-700 disabled:bg-gray-400"
                            >
                                {loading ? "..." : "Award"}
                            </button>
                        </div>
                        <div className="flex gap-2 mt-2">
                            <button
                                onClick={() => setResolveWinner(client)}
                                className="text-xs underline text-blue-600 hover:text-blue-800"
                            >
                                Use Client Address
                            </button>
                            <button
                                onClick={() => setResolveWinner(freelancer)}
                                className="text-xs underline text-blue-600 hover:text-blue-800"
                            >
                                Use Freelancer Address
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
