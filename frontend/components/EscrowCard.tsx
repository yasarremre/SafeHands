"use client";

import { CheckCircle, ShieldCheck, AlertTriangle } from "lucide-react";
import { approve } from "@/utils/soroban";
import { useState } from "react";

export type EscrowState = "Funded" | "Released";

export interface EscrowProps {
    id: string;
    client: string;
    freelancer: string;
    amount: string;
    state: EscrowState;
    approvedByClient: boolean;
    approvedByFreelancer: boolean;
    userAddress: string;
    onUpdate: () => void;
}

export default function EscrowCard({
    id,
    client,
    freelancer,
    amount,
    state,
    approvedByClient,
    approvedByFreelancer,
    userAddress,
    onUpdate,
}: EscrowProps) {
    const [loading, setLoading] = useState(false);
    const isClient = userAddress === client;
    const isFreelancer = userAddress === freelancer;

    const canApprove =
        state === "Funded" &&
        ((isClient && !approvedByClient) || (isFreelancer && !approvedByFreelancer));

    const handleApprove = async () => {
        if (!canApprove) return;
        setLoading(true);
        try {
            await approve(userAddress, id);
            alert("Approved successfully!");
            onUpdate();
        } catch (e) {
            console.error(e);
            alert("Failed to approve transaction.");
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
                    <div className={`mt-2 inline-flex items-center gap-2 px-3 py-1 text-sm font-bold uppercase border-2 text-black ${state === "Released" ? "bg-green-400 border-black" : "bg-yellow-400 border-black"
                        }`}>
                        {state === "Released" ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                        {state}
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-3xl font-black">{amount} XLM</div>
                    <div className="text-xs font-bold uppercase tracking-widest text-gray-500">Locked</div>
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

            {/* Action */}
            {canApprove && (
                <button
                    onClick={handleApprove}
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
        </div>
    );
}
