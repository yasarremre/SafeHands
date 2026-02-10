"use client";

import { useEffect, useState, use } from "react";
import { getEscrow } from "@/utils/soroban";
import { formatXLM } from "@/utils/format";
import { approve, cancel, dispute, resolve, claimTimeout } from "@/utils/soroban";
import { getJobMetadata, CATEGORY_CONFIG, JobMetadata } from "@/utils/jobStore";
import { ArrowLeft, CheckCircle, ShieldCheck, AlertTriangle, XCircle, Scale, Ban, Copy, Check, Clock, Info } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

type EscrowState = "Funded" | "Released" | "Cancelled" | "Disputed" | "Resolved";

const STATE_CONFIG: Record<EscrowState, { bg: string; icon: React.ReactNode; label: string; description: string }> = {
    Funded: { bg: "bg-yellow-400", icon: <AlertTriangle size={20} />, label: "Active", description: "Funds are locked in the smart contract. Awaiting mutual approval to release." },
    Released: { bg: "bg-green-400", icon: <CheckCircle size={20} />, label: "Completed", description: "Both parties approved. Funds have been transferred to the freelancer." },
    Cancelled: { bg: "bg-red-300", icon: <Ban size={20} />, label: "Cancelled", description: "Escrow cancelled. Funds refunded to the client." },
    Disputed: { bg: "bg-orange-400", icon: <Scale size={20} />, label: "In Dispute", description: "A dispute has been raised. The arbiter will review and decide." },
    Resolved: { bg: "bg-blue-300", icon: <ShieldCheck size={20} />, label: "Resolved", description: "Dispute resolved by arbiter. Funds awarded to the winner." },
};

function getGuidance(state: EscrowState, isClient: boolean, isFreelancer: boolean, isArbiter: boolean, approvedByClient: boolean, approvedByFreelancer: boolean): string | null {
    if (state === "Funded") {
        if (isClient && !approvedByClient && !approvedByFreelancer) return "⏳ Waiting for freelancer to complete the work. You can cancel if needed.";
        if (isClient && !approvedByClient && approvedByFreelancer) return "👉 Freelancer approved delivery. Review and click Approve to release payment, or Dispute if unsatisfied.";
        if (isClient && approvedByClient && !approvedByFreelancer) return "✅ You approved. Waiting for freelancer to also approve for fund release.";
        if (isFreelancer && !approvedByFreelancer) return "👉 Review the job requirements below. Click Approve when you've delivered the work.";
        if (isFreelancer && approvedByFreelancer) return "✅ You approved. Waiting for client to review and approve your delivery.";
    }
    if (state === "Disputed") {
        if (isArbiter) return "⚖️ A dispute has been raised between the parties. Review the details and award funds to the rightful party.";
        if (isClient || isFreelancer) return "⏳ Your dispute is being reviewed by the arbiter. Please wait for resolution.";
    }
    if (state === "Released") return "🎉 Job completed successfully! Funds have been released to the freelancer.";
    if (state === "Cancelled") return "❌ This job was cancelled. Funds have been refunded to the client.";
    if (state === "Resolved") return "⚖️ Dispute resolved by arbiter. Funds have been awarded to the winner.";
    return null;
}

interface EscrowData {
    client: string;
    freelancer: string;
    arbiter: string;
    amount: string;
    state: EscrowState;
    approved_by_client: boolean;
    approved_by_freelancer: boolean;
    deadline?: string;
}

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <button onClick={handleCopy} className="ml-2 text-gray-400 hover:text-black transition-colors">
            {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
        </button>
    );
}

export default function EscrowDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const escrowId = resolvedParams.id;
    const [escrow, setEscrow] = useState<EscrowData | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [userAddress, setUserAddress] = useState("");
    const [resolveWinner, setResolveWinner] = useState("");
    const [jobMeta, setJobMeta] = useState<JobMetadata | null>(null);

    useEffect(() => {
        const getAddr = async () => {
            try {
                const { getAddress } = await import("@stellar/freighter-api");
                const result = await getAddress();
                if (result?.address) setUserAddress(result.address);
            } catch { /* Not connected */ }
        };
        getAddr();
    }, []);

    useEffect(() => {
        setJobMeta(getJobMetadata(escrowId));
    }, [escrowId]);

    const fetchEscrow = async () => {
        setLoading(true);
        try {
            const data = await getEscrow(escrowId, userAddress || undefined);
            if (data) {
                const d = data as Record<string, unknown>;
                const states: EscrowState[] = ["Funded", "Released", "Cancelled", "Disputed", "Resolved"];
                setEscrow({
                    client: d.client?.toString() ?? "",
                    freelancer: d.freelancer?.toString() ?? "",
                    arbiter: d.arbiter?.toString() ?? "",
                    amount: d.amount?.toString() ?? "0",
                    state: states[Number(d.state)] || "Funded",
                    approved_by_client: Boolean(d.approved_by_client),
                    approved_by_freelancer: Boolean(d.approved_by_freelancer),
                    deadline: d.deadline?.toString(),
                });
            }
        } catch (err) {
            console.error("Failed to fetch escrow", err);
            toast.error("Failed to load escrow details");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEscrow();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [escrowId, userAddress]);

    const handleAction = async (action: () => Promise<unknown>, successMsg: string) => {
        setActionLoading(true);
        try {
            await action();
            toast.success(successMsg);
            fetchEscrow();
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : "Unknown error";
            toast.error(`Action failed: ${message}`);
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <main className="min-h-screen bg-[#F0F0F0] flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin w-12 h-12 border-4 border-black border-t-transparent rounded-full mx-auto mb-4" />
                    <p className="font-mono font-bold uppercase">Loading Job #{escrowId}...</p>
                </div>
            </main>
        );
    }

    if (!escrow) {
        return (
            <main className="min-h-screen bg-[#F0F0F0] flex items-center justify-center">
                <div className="text-center">
                    <p className="text-4xl font-black mb-4">404</p>
                    <p className="font-mono mb-8">Job #{escrowId} not found</p>
                    <Link href="/" className="bg-black text-white px-6 py-3 font-bold uppercase border-2 border-black hover:bg-gray-900">← Back to Dashboard</Link>
                </div>
            </main>
        );
    }

    const stateConfig = STATE_CONFIG[escrow.state];
    const isClient = userAddress === escrow.client;
    const isFreelancer = userAddress === escrow.freelancer;
    const isArbiter = userAddress === escrow.arbiter;

    const canApprove = escrow.state === "Funded" && ((isClient && !escrow.approved_by_client) || (isFreelancer && !escrow.approved_by_freelancer));
    const canCancel = escrow.state === "Funded" && isClient && !escrow.approved_by_freelancer;
    const canDispute = escrow.state === "Funded" && (isClient || isFreelancer);
    const canResolve = escrow.state === "Disputed" && isArbiter;

    const deadlineTs = escrow.deadline ? Number(escrow.deadline) : 0;
    const isExpired = deadlineTs > 0 && Date.now() / 1000 > deadlineTs;
    const canClaimTimeout = isExpired && (escrow.state === "Funded" || escrow.state === "Disputed");
    const deadlineDate = deadlineTs > 0 ? new Date(deadlineTs * 1000) : null;

    const guidance = getGuidance(escrow.state, isClient, isFreelancer, isArbiter, escrow.approved_by_client, escrow.approved_by_freelancer);
    const catConfig = jobMeta?.category ? CATEGORY_CONFIG[jobMeta.category] : null;

    return (
        <main className="min-h-screen bg-[#F0F0F0] text-black font-sans">
            {/* Header */}
            <header className="border-b-4 border-black bg-white">
                <div className="container mx-auto px-4 py-4 flex items-center gap-4">
                    <Link href="/" className="flex items-center gap-2 font-bold uppercase hover:text-blue-600 transition-colors">
                        <ArrowLeft size={20} /> Dashboard
                    </Link>
                    <span className="text-gray-300">|</span>
                    <h1 className="text-xl font-black font-mono">Job #{escrowId}</h1>
                </div>
            </header>

            <div className="container mx-auto px-4 py-8 max-w-3xl">
                {/* State Banner */}
                <div className={`${stateConfig.bg} border-4 border-black p-6 mb-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]`}>
                    <div className="flex items-center gap-3 mb-2">
                        {stateConfig.icon}
                        <span className="text-2xl font-black uppercase">{stateConfig.label}</span>
                    </div>
                    <p className="font-mono text-sm">{stateConfig.description}</p>
                </div>

                {/* Guidance */}
                {guidance && (
                    <div className="bg-blue-50 border-4 border-blue-300 p-4 mb-6 flex items-start gap-3">
                        <Info size={20} className="text-blue-500 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-bold text-sm uppercase text-blue-800 mb-1">What to do next</p>
                            <p className="font-mono text-sm text-blue-700">{guidance}</p>
                        </div>
                    </div>
                )}

                {/* Job Details Card */}
                <div className="bg-white border-4 border-black p-6 mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <div className="flex items-center gap-2 mb-4">
                        {catConfig && (
                            <span className={`${catConfig.color} text-sm px-3 py-1 font-bold uppercase border-2 border-black`}>
                                {catConfig.emoji} {jobMeta?.category}
                            </span>
                        )}
                    </div>
                    <h2 className="text-3xl font-black mb-2">{jobMeta?.title || `Escrow #${escrowId}`}</h2>
                    {jobMeta?.description ? (
                        <div className="border-t-2 border-gray-200 pt-4 mt-4">
                            <p className="font-bold text-xs uppercase text-gray-400 mb-2">Job Description</p>
                            <p className="font-mono text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{jobMeta.description}</p>
                        </div>
                    ) : (
                        <p className="text-gray-400 font-mono text-sm italic">No description provided</p>
                    )}
                    {jobMeta?.createdAt && (
                        <p className="text-xs font-mono text-gray-400 mt-4">Created: {new Date(jobMeta.createdAt).toLocaleDateString()} {new Date(jobMeta.createdAt).toLocaleTimeString()}</p>
                    )}
                </div>

                {/* Amount Card */}
                <div className="bg-white border-4 border-black p-8 mb-6 text-center brutalist-shadow">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Escrow Amount</p>
                    <p className="text-5xl font-black">{formatXLM(escrow.amount)} <span className="text-2xl text-gray-500">XLM</span></p>
                    {deadlineDate && (
                        <div className={`mt-3 text-sm font-mono flex items-center justify-center gap-2 ${isExpired ? 'text-red-600' : 'text-gray-500'}`}>
                            <Clock size={14} />
                            {isExpired ? "DEADLINE EXPIRED" : `Deadline: ${deadlineDate.toLocaleDateString()} ${deadlineDate.toLocaleTimeString()}`}
                        </div>
                    )}
                </div>

                {/* Parties */}
                <div className="grid grid-cols-1 gap-4 mb-6">
                    {[
                        { label: "Client", address: escrow.client, isYou: isClient },
                        { label: "Freelancer", address: escrow.freelancer, isYou: isFreelancer },
                        { label: "Arbiter", address: escrow.arbiter, isYou: isArbiter },
                    ].map(({ label, address, isYou }) => (
                        <div key={label} className="bg-white border-2 border-black p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-black uppercase text-xs text-gray-500">{label}</span>
                                {isYou && <span className="bg-blue-600 text-white text-xs px-2 py-0.5 font-bold uppercase">You</span>}
                            </div>
                            <div className="flex items-center">
                                <span className="font-mono text-sm break-all flex-1">{address}</span>
                                <CopyButton text={address} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Approval Status */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className={`p-4 border-2 border-black text-center ${escrow.approved_by_client ? 'bg-green-200' : 'bg-gray-100 opacity-60'}`}>
                        <span className="block font-bold uppercase text-xs mb-1">Client Approval</span>
                        <span className="text-lg">{escrow.approved_by_client ? "✅ Approved" : "⏳ Pending"}</span>
                    </div>
                    <div className={`p-4 border-2 border-black text-center ${escrow.approved_by_freelancer ? 'bg-green-200' : 'bg-gray-100 opacity-60'}`}>
                        <span className="block font-bold uppercase text-xs mb-1">Freelancer Approval</span>
                        <span className="text-lg">{escrow.approved_by_freelancer ? "✅ Approved" : "⏳ Pending"}</span>
                    </div>
                </div>

                {/* Actions */}
                {!userAddress && (
                    <div className="bg-yellow-100 border-2 border-yellow-500 p-4 mb-6 text-center">
                        <p className="font-bold text-sm">Connect your Freighter Wallet from the <Link href="/" className="underline text-blue-600">Dashboard</Link> to perform actions.</p>
                    </div>
                )}

                <div className="space-y-4">
                    {canApprove && (
                        <button
                            onClick={() => handleAction(() => approve(userAddress, escrowId), "Approved successfully! ✅")}
                            disabled={actionLoading}
                            className="w-full bg-blue-600 text-white py-4 font-black uppercase tracking-widest hover:bg-blue-700 disabled:bg-gray-400 border-2 border-black brutalist-shadow active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all flex items-center justify-center gap-2"
                        >
                            {actionLoading ? "Processing..." : <><ShieldCheck size={20} /> Approve Release</>}
                        </button>
                    )}
                    {canCancel && (
                        <button
                            onClick={() => handleAction(() => cancel(userAddress, escrowId), "Job cancelled! Funds refunded. 💰")}
                            disabled={actionLoading}
                            className="w-full bg-red-500 text-white py-4 font-black uppercase tracking-widest hover:bg-red-600 disabled:bg-gray-400 border-2 border-black brutalist-shadow active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all flex items-center justify-center gap-2"
                        >
                            {actionLoading ? "Processing..." : <><XCircle size={20} /> Cancel & Refund</>}
                        </button>
                    )}
                    {canDispute && (
                        <button
                            onClick={() => handleAction(() => dispute(userAddress, escrowId), "Dispute raised! ⚠️")}
                            disabled={actionLoading}
                            className="w-full bg-orange-500 text-white py-4 font-black uppercase tracking-widest hover:bg-orange-600 disabled:bg-gray-400 border-2 border-black brutalist-shadow active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all flex items-center justify-center gap-2"
                        >
                            {actionLoading ? "Processing..." : <><Scale size={20} /> Raise Dispute</>}
                        </button>
                    )}
                    {canResolve && (
                        <div className="border-4 border-black p-6 bg-blue-50">
                            <h4 className="font-black uppercase text-lg mb-4">Resolve Dispute</h4>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <input
                                    type="text"
                                    placeholder="Winner Address (G...)"
                                    value={resolveWinner}
                                    onChange={(e) => setResolveWinner(e.target.value)}
                                    className="flex-1 border-2 border-black p-3 font-mono text-sm"
                                />
                                <button
                                    onClick={() => handleAction(() => resolve(userAddress, escrowId, resolveWinner), "Dispute resolved! ⚖️")}
                                    disabled={actionLoading || !resolveWinner}
                                    className="bg-blue-600 text-white px-6 py-3 font-bold uppercase border-2 border-black hover:bg-blue-700 disabled:bg-gray-400"
                                >
                                    {actionLoading ? "..." : "Award Funds"}
                                </button>
                            </div>
                            <div className="flex gap-3 mt-3">
                                <button onClick={() => setResolveWinner(escrow.client)} className="text-sm underline text-blue-600 hover:text-blue-800">→ Client</button>
                                <button onClick={() => setResolveWinner(escrow.freelancer)} className="text-sm underline text-blue-600 hover:text-blue-800">→ Freelancer</button>
                            </div>
                        </div>
                    )}
                    {canClaimTimeout && (
                        <button
                            onClick={() => handleAction(() => claimTimeout(escrowId, userAddress), "Timeout claimed! Funds refunded. ⏰")}
                            disabled={actionLoading}
                            className="w-full bg-gray-800 text-white py-4 font-black uppercase tracking-widest hover:bg-gray-900 disabled:bg-gray-400 border-2 border-black brutalist-shadow active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all flex items-center justify-center gap-2"
                        >
                            {actionLoading ? "Processing..." : <><Clock size={20} /> Claim Timeout Refund</>}
                        </button>
                    )}
                </div>
            </div>
        </main>
    );
}
