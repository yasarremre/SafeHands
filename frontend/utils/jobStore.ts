/**
 * Job Metadata Store (localStorage)
 * 
 * Soroban contract storage is expensive for strings,
 * so we store job details (title, description, category)
 * off-chain in the browser's localStorage.
 * 
 * Key format: "safehands_job_{escrowId}"
 */

export interface JobMetadata {
    title: string;
    description: string;
    category: JobCategory;
    createdAt: string; // ISO date
}

export type JobCategory =
    | "Development"
    | "Design"
    | "Writing"
    | "Marketing"
    | "Consulting"
    | "Other";

export const JOB_CATEGORIES: JobCategory[] = [
    "Development",
    "Design",
    "Writing",
    "Marketing",
    "Consulting",
    "Other",
];

const STORAGE_PREFIX = "safehands_job_";

export function saveJobMetadata(escrowId: string, metadata: Omit<JobMetadata, "createdAt">): void {
    const data: JobMetadata = {
        ...metadata,
        createdAt: new Date().toISOString(),
    };
    try {
        localStorage.setItem(`${STORAGE_PREFIX}${escrowId}`, JSON.stringify(data));
    } catch (e) {
        console.warn("Failed to save job metadata to localStorage:", e);
    }
}

export function getJobMetadata(escrowId: string): JobMetadata | null {
    try {
        const raw = localStorage.getItem(`${STORAGE_PREFIX}${escrowId}`);
        if (!raw) return null;
        return JSON.parse(raw) as JobMetadata;
    } catch {
        return null;
    }
}

export function getAllJobMetadata(): Record<string, JobMetadata> {
    const result: Record<string, JobMetadata> = {};
    try {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith(STORAGE_PREFIX)) {
                const id = key.replace(STORAGE_PREFIX, "");
                const data = getJobMetadata(id);
                if (data) result[id] = data;
            }
        }
    } catch {
        // localStorage not available
    }
    return result;
}

/** Category display config */
export const CATEGORY_CONFIG: Record<JobCategory, { emoji: string; color: string }> = {
    Development: { emoji: "💻", color: "bg-purple-200" },
    Design: { emoji: "🎨", color: "bg-pink-200" },
    Writing: { emoji: "✍️", color: "bg-emerald-200" },
    Marketing: { emoji: "📢", color: "bg-amber-200" },
    Consulting: { emoji: "💼", color: "bg-cyan-200" },
    Other: { emoji: "📦", color: "bg-gray-200" },
};
