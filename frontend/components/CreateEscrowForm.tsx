"use client";

import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { deposit } from "@/utils/soroban";
import { parseXLMtoStroops } from "@/utils/format";
import { saveJobMetadata, JOB_CATEGORIES, JobCategory } from "@/utils/jobStore";
import toast from "react-hot-toast";

export default function CreateEscrowForm({
    clientAddress,
    onSuccess,
}: {
    clientAddress: string;
    onSuccess?: () => void;
}) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState<JobCategory>("Development");
    const [freelancer, setFreelancer] = useState("");
    const [arbiter, setArbiter] = useState("");
    const [amount, setAmount] = useState("");
    const [deadlineDays, setDeadlineDays] = useState("30");
    const [loading, setLoading] = useState(false);

    const handleDeposit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!clientAddress) return toast.error("Connect wallet first!");
        if (!title.trim()) return toast.error("Please enter a job title");

        setLoading(true);
        try {
            const arbiterAddr = arbiter || clientAddress;
            const stroops = parseXLMtoStroops(amount);
            const result = await deposit(clientAddress, freelancer, arbiterAddr, stroops, parseInt(deadlineDays) || 30);

            // Extract escrow ID from transaction result and save job metadata
            // The escrow ID is typically the return value from the deposit contract call
            // For now, we save with the current next-ID approach
            const escrowId = extractEscrowId(result);
            if (escrowId !== null) {
                saveJobMetadata(escrowId.toString(), { title: title.trim(), description: description.trim(), category });
            }

            toast.success("Job escrow created successfully! 🎉");
            setTitle("");
            setDescription("");
            setCategory("Development");
            setFreelancer("");
            setArbiter("");
            setAmount("");
            setDeadlineDays("30");
            onSuccess?.();
        } catch (err: unknown) {
            console.error(err);
            const message = err instanceof Error ? err.message : String(err);
            toast.error(`Failed to create escrow: ${message}`);
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

            <form onSubmit={handleDeposit} className="space-y-5">
                {/* Job Title */}
                <div>
                    <label className="block font-black mb-2 uppercase text-sm">Job Title *</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-white border-2 border-black p-4 font-mono text-sm focus:outline-none focus:ring-4 focus:ring-yellow-400 transition-all placeholder:text-gray-400"
                        placeholder="e.g. Logo Design for Startup"
                        required
                        maxLength={100}
                    />
                </div>

                {/* Category */}
                <div>
                    <label className="block font-black mb-2 uppercase text-sm">Category</label>
                    <div className="flex flex-wrap gap-2">
                        {JOB_CATEGORIES.map((cat) => (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => setCategory(cat)}
                                className={`px-3 py-1.5 text-xs font-bold uppercase border-2 border-black transition-all
                                    ${category === cat
                                        ? "bg-black text-white shadow-[2px_2px_0px_0px_black]"
                                        : "bg-white hover:bg-gray-100"
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label className="block font-black mb-2 uppercase text-sm">Job Description</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full bg-white border-2 border-black p-4 font-mono text-sm focus:outline-none focus:ring-4 focus:ring-yellow-400 transition-all placeholder:text-gray-400 resize-y min-h-[100px]"
                        placeholder="Describe the work to be done, deliverables, and any requirements..."
                        rows={4}
                        maxLength={1000}
                    />
                    <p className="text-xs text-gray-400 mt-1 font-mono text-right">{description.length}/1000</p>
                </div>

                {/* Freelancer */}
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="font-black uppercase text-sm">Freelancer Address (G...) *</label>
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
                        className="w-full bg-white border-2 border-black p-4 font-mono text-sm focus:outline-none focus:ring-4 focus:ring-yellow-400 transition-all placeholder:text-gray-400"
                        placeholder="G..."
                        required
                        pattern="G[A-Z0-9]{55}"
                        title="Must be a valid Stellar Public Key starting with 'G' (56 chars)"
                    />
                </div>

                {/* Arbiter */}
                <div>
                    <label className="block font-black mb-2 uppercase text-sm">Arbiter Address (Optional)</label>
                    <input
                        type="text"
                        value={arbiter}
                        onChange={(e) => setArbiter(e.target.value)}
                        className="w-full bg-white border-2 border-black p-4 font-mono text-sm focus:outline-none focus:ring-4 focus:ring-yellow-400 transition-all placeholder:text-gray-400"
                        placeholder="G... (Defaults to Self/Client if empty)"
                    />
                </div>

                {/* Amount + Deadline Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block font-black mb-2 uppercase text-sm">Amount (XLM) *</label>
                        <input
                            type="number"
                            step="0.0000001"
                            min="0.0000001"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full bg-white border-2 border-black p-4 font-mono text-sm focus:outline-none focus:ring-4 focus:ring-yellow-400 transition-all placeholder:text-gray-400"
                            placeholder="10.00"
                            required
                        />
                    </div>
                    <div>
                        <label className="block font-black mb-2 uppercase text-sm">Deadline (Days)</label>
                        <input
                            type="number"
                            min="1"
                            max="365"
                            value={deadlineDays}
                            onChange={(e) => setDeadlineDays(e.target.value)}
                            className="w-full bg-white border-2 border-black p-4 font-mono text-sm focus:outline-none focus:ring-4 focus:ring-yellow-400 transition-all placeholder:text-gray-400"
                            placeholder="30"
                            required
                        />
                    </div>
                </div>
                <p className="text-xs text-gray-400 font-mono -mt-3">Auto-refund to client if not resolved within deadline</p>

                <button
                    type="submit"
                    disabled={loading || !clientAddress}
                    className="w-full bg-black text-white font-black py-5 uppercase tracking-widest hover:bg-gray-900 disabled:bg-gray-400 disabled:cursor-not-allowed border-2 border-black brutalist-shadow active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all"
                >
                    {loading ? (
                        <span className="flex items-center justify-center gap-2">
                            <Loader2 className="animate-spin" /> Creating Job...
                        </span>
                    ) : (
                        "Lock Funds & Create Job"
                    )}
                </button>
            </form>
        </div>
    );
}

/**
 * Try to extract the escrow ID from the transaction result.
 * The deposit function returns a u64. We try to parse it from
 * the result metadata. Falls back to localStorage key counting.
 */
function extractEscrowId(result: unknown): number | null {
    try {
        // Try to get from returnValue in the result
        if (result && typeof result === "object") {
            const r = result as Record<string, unknown>;
            if (r.returnValue !== undefined) {
                return Number(r.returnValue);
            }
            // Try resultMetaXdr approach
            if (r.resultMetaXdr) {
                // The return value should be in the meta
                return null; // Let polling handle it
            }
        }
    } catch {
        // ignore
    }
    // Fallback: count existing jobs in localStorage
    try {
        let maxId = -1;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith("safehands_job_")) {
                const id = parseInt(key.replace("safehands_job_", ""));
                if (!isNaN(id) && id > maxId) maxId = id;
            }
        }
        return maxId + 1;
    } catch {
        return null;
    }
}
