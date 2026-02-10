"use client";

import { CheckCircle, ShieldCheck, AlertTriangle, XCircle, Scale, Ban, ExternalLink, Clock, Info } from "lucide-react";
import { approve, cancel, dispute, resolve, claimTimeout } from "@/utils/soroban";
import { formatXLM } from "@/utils/format";
import { getJobMetadata, CATEGORY_CONFIG, JobMetadata } from "@/utils/jobStore";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Link from "next/link";

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
    deadline?: string;
    userAddress: string;
    onUpdate: () => void;
}

const STATE_CONFIG: Record<EscrowState, { bg: string; icon: React.ReactNode; label: string }> = {
    Funded: { bg: "bg-yellow-400", icon: <AlertTriangle size={16} />, label: "Active" },
    Released: { bg: "bg-green-400", icon: <CheckCircle size={16} />, label: "Completed" },
    Cancelled: { bg: "bg-red-300", icon: <Ban size={16} />, label: "Cancelled" },
    Disputed: { bg: "bg-orange-400", icon: <Scale size={16} />, label: "In Dispute" },
    Resolved: { bg: "bg-blue-300", icon: <ShieldCheck size={16} />, label: "Resolved" },
};

/** Step-by-step guidance messages per state and role */
function getGuidance(state: EscrowState, isClient: boolean, isFreelancer: boolean, isArbiter: boolean, approvedByClient: boolean, approvedByFreelancer: boolean): string | null {
    if (state === "Funded") {
        if (isClient && !approvedByClient && !approvedByFreelancer) return "⏳ Waiting for freelancer to start. You can cancel if needed.";
        if (isClient && !approvedByClient && approvedByFreelancer) return "👉 Freelancer approved. Review the work and click Approve to release payment.";
        if (isClient && approvedByClient && !approvedByFreelancer) return "✅ You approved. Waiting for freelancer to approve and release funds.";
        if (isFreelancer && !approvedByFreelancer) return "👉 Review the job details. Click Approve when you've completed the work.";
        if (isFreelancer && approvedByFreelancer) return "✅ You approved. Waiting for client to approve and release your payment.";
    }
    if (state === "Disputed") {
        if (isArbiter) return "⚖️ A dispute has been raised. Review the case and award funds to the rightful party.";
        if (isClient || isFreelancer) return "⏳ Dispute is being reviewed by the arbiter.";
    }
    if (state === "Released") return "🎉 Job completed! Funds have been released to the freelancer.";
    if (state === "Cancelled") return "❌ This job was cancelled. Funds refunded to the client.";
    if (state === "Resolved") return "⚖️ Dispute resolved by arbiter. Funds awarded to the winner.";
    return null;
}

function truncateAddress(addr: string) {
    if (!addr || addr.length <= 12) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-6)}`;
}

export default function EscrowCard({
    id,
    client,
    freelancer,
    arbiter,
    amount,
    state,
    approvedByClient,
    approvedByFreelancer,
    deadline,
    userAddress,
    onUpdate,
}: EscrowProps) {
    const [loading, setLoading] = useState(false);
    const [resolveWinner, setResolveWinner] = useState("");
    const [jobMeta, setJobMeta] = useState<JobMetadata | null>(null);

    const isClient = userAddress === client;
    const isFreelancer = userAddress === freelancer;
    const isArbiter = arbiter ? userAddress === arbiter : false;

    useEffect(() => {
        setJobMeta(getJobMetadata(id));
    }, [id]);

    const canApprove =
        state === "Funded" &&
        ((isClient && !approvedByClient) || (isFreelancer && !approvedByFreelancer));

    const canCancel =
        state === "Funded" && isClient && !approvedByFreelancer;

    const canDispute =
        state === "Funded" && (isClient || isFreelancer);

    const canResolve =
        state === "Disputed" && isArbiter;

    // Deadline logic
    const deadlineTs = deadline ? Number(deadline) : 0;
    const isExpired = deadlineTs > 0 && Date.now() / 1000 > deadlineTs;
    const canClaimTimeout = isExpired && (state === "Funded" || state === "Disputed");
    const deadlineDate = deadlineTs > 0 ? new Date(deadlineTs * 1000) : null;

    const stateConfig = STATE_CONFIG[state] || STATE_CONFIG.Funded;
    const guidance = getGuidance(state, isClient, isFreelancer, isArbiter, approvedByClient, approvedByFreelancer);
    const catConfig = jobMeta?.category ? CATEGORY_CONFIG[jobMeta.category] : null;

    const handleAction = async (action: () => Promise<unknown>, successMsg: string) => {
        setLoading(true);
        try {
            await action();
            toast.success(successMsg);
            onUpdate();
        } catch (e: unknown) {
            console.error(e);
            const message = e instanceof Error ? e.message : "Unknown error";
            toast.error(`Action failed: ${message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white brutalist-border brutalist-shadow p-4 sm:p-6 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start mb-4 border-b-2 border-black pb-4 gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        {catConfig && (
                            <span className={`${catConfig.color} text-xs px-2 py-0.5 font-bold uppercase border border-black`}>
                                {catConfig.emoji} {jobMeta?.category}
                            </span>
                        )}
                        <span className="text-xs font-mono text-gray-400">#{id}</span>
                        <Link
                            href={`/escrow/${id}`}
                            className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-xs font-bold"
                        >
                            Details <ExternalLink size={10} />
                        </Link>
                    </div>
                    <h3 className="text-xl font-black mt-1 truncate">
                        {jobMeta?.title || `Escrow #${id}`}
                    </h3>
                    <div className={`mt-2 inline-flex items-center gap-2 px-3 py-1 text-xs font-bold uppercase border-2 text-black ${stateConfig.bg} border-black`}>
                        {stateConfig.icon}
                        {stateConfig.label}
                    </div>
                </div>
                <div className="sm:text-right shrink-0">
                    <div className="text-2xl sm:text-3xl font-black">{formatXLM(amount)} <span className="text-lg text-gray-500">XLM</span></div>
                    <div className="text-xs font-bold uppercase tracking-widest text-gray-500">
                        {state === "Released" ? "Released" : state === "Cancelled" ? "Refunded" : "Locked"}
                    </div>
                    {deadlineDate && state === "Funded" && (
                        <div className={`mt-1 text-xs font-mono flex items-center gap-1 sm:justify-end ${isExpired ? 'text-red-600' : 'text-gray-500'}`}>
                            <Clock size={10} />
                            {isExpired ? "EXPIRED" : `Due: ${deadlineDate.toLocaleDateString()}`}
                        </div>
                    )}
                </div>
            </div>

            {/* Guidance Banner */}
            {guidance && (
                <div className="bg-blue-50 border-2 border-blue-300 p-3 mb-4 flex items-start gap-2 text-sm">
                    <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
                    <span className="font-mono text-blue-800">{guidance}</span>
                </div>
            )}

            {/* Description Preview */}
            {jobMeta?.description && (
                <div className="mb-4 text-sm font-mono text-gray-600 bg-gray-50 p-3 border border-gray-200 line-clamp-2">
                    {jobMeta.description}
                </div>
            )}

            {/* Parties (Compact) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4 text-xs font-mono">
                <div className="bg-gray-100 p-2 border border-black">
                    <span className="font-bold uppercase text-gray-500">Client {isClient && <span className="text-blue-600">(You)</span>}</span>
                    <div className="truncate">{truncateAddress(client)}</div>
                </div>
                <div className="bg-gray-100 p-2 border border-black">
                    <span className="font-bold uppercase text-gray-500">Freelancer {isFreelancer && <span className="text-blue-600">(You)</span>}</span>
                    <div className="truncate">{truncateAddress(freelancer)}</div>
                </div>
            </div>

            {/* Approval Status */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className={`p-2 border-2 border-black text-center text-xs ${approvedByClient ? 'bg-green-200' : 'bg-gray-100 opacity-50'}`}>
                    <span className="block font-bold uppercase text-xs">Client</span>
                    {approvedByClient ? "✅ Approved" : "⏳ Pending"}
                </div>
                <div className={`p-2 border-2 border-black text-center text-xs ${approvedByFreelancer ? 'bg-green-200' : 'bg-gray-100 opacity-50'}`}>
                    <span className="block font-bold uppercase text-xs">Freelancer</span>
                    {approvedByFreelancer ? "✅ Approved" : "⏳ Pending"}
                </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
                {canApprove && (
                    <button
                        onClick={() => handleAction(() => approve(userAddress, id), "Approved successfully! ✅")}
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-3 font-black uppercase tracking-widest hover:bg-blue-700 disabled:bg-gray-400 border-2 border-black brutalist-shadow active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all flex items-center justify-center gap-2 text-sm"
                    >
                        {loading ? "Processing..." : <><ShieldCheck size={18} /> Approve Release</>}
                    </button>
                )}

                {canCancel && (
                    <button
                        onClick={() => handleAction(() => cancel(userAddress, id), "Job cancelled and refunded! 💰")}
                        disabled={loading}
                        className="w-full bg-red-500 text-white py-3 font-black uppercase tracking-widest hover:bg-red-600 disabled:bg-gray-400 border-2 border-black brutalist-shadow active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all flex items-center justify-center gap-2 text-sm"
                    >
                        {loading ? "Processing..." : <><XCircle size={18} /> Cancel & Refund</>}
                    </button>
                )}

                {canDispute && (
                    <button
                        onClick={() => handleAction(() => dispute(userAddress, id), "Dispute raised! ⚠️")}
                        disabled={loading}
                        className="w-full bg-orange-500 text-white py-3 font-black uppercase tracking-widest hover:bg-orange-600 disabled:bg-gray-400 border-2 border-black brutalist-shadow active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all flex items-center justify-center gap-2 text-sm"
                    >
                        {loading ? "Processing..." : <><Scale size={18} /> Raise Dispute</>}
                    </button>
                )}

                {canResolve && (
                    <div className="border-2 border-black p-4 bg-blue-50">
                        <h4 className="font-black uppercase text-sm mb-3">Resolve Dispute</h4>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <input
                                type="text"
                                placeholder="Winner Address (G...)"
                                value={resolveWinner}
                                onChange={(e) => setResolveWinner(e.target.value)}
                                className="flex-1 border-2 border-black p-2 font-mono text-sm"
                            />
                            <button
                                onClick={() => handleAction(() => resolve(userAddress, id, resolveWinner), "Dispute resolved! ⚖️")}
                                disabled={loading || !resolveWinner}
                                className="bg-blue-600 text-white px-4 py-2 font-bold uppercase border-2 border-black hover:bg-blue-700 disabled:bg-gray-400"
                            >
                                {loading ? "..." : "Award"}
                            </button>
                        </div>
                        <div className="flex gap-2 mt-2">
                            <button onClick={() => setResolveWinner(client)} className="text-xs underline text-blue-600">→ Client</button>
                            <button onClick={() => setResolveWinner(freelancer)} className="text-xs underline text-blue-600">→ Freelancer</button>
                        </div>
                    </div>
                )}

                {canClaimTimeout && (
                    <button
                        onClick={() => handleAction(() => claimTimeout(id, userAddress), "Timeout claimed! Funds refunded. ⏰")}
                        disabled={loading}
                        className="w-full bg-gray-800 text-white py-3 font-black uppercase tracking-widest hover:bg-gray-900 disabled:bg-gray-400 border-2 border-black brutalist-shadow active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all flex items-center justify-center gap-2 text-sm"
                    >
                        {loading ? "Processing..." : <><Clock size={18} /> Claim Timeout Refund</>}
                    </button>
                )}
            </div>
        </div>
    );
}
