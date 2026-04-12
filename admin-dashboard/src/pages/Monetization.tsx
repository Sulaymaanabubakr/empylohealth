import { useCallback, useEffect, useState } from "react";
import { adminApi } from "../lib/adminApi";

type Overview = {
    plans?: Record<string, number>;
    revenue?: number;
    boostPurchases?: number;
    churnEvents?: number;
    conversions?: number;
    aiCreditsUsed?: number;
    huddleMinutesUsed?: number;
    activeHuddles?: number;
    failedUsageEvents?: number;
    organisations?: number;
};

type Organisation = {
    id: string;
    name: string;
    slug: string;
    status: string;
    contactEmail?: string;
    seatCount: number;
    activeSeatCount: number;
    config?: Record<string, unknown>;
};

const StatCard = ({ label, value, note }: { label: string; value: string | number; note?: string }) => (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm dark:bg-dark dark:border-gray-800">
        <p className="text-xs uppercase tracking-widest text-gray-500">{label}</p>
        <p className="mt-2 text-3xl font-display text-gray-900 dark:text-gray-100">{value}</p>
        {note ? <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{note}</p> : null}
    </div>
);

export const Monetization = () => {
    const [loading, setLoading] = useState(true);
    const [savingOrg, setSavingOrg] = useState(false);
    const [savingSeat, setSavingSeat] = useState(false);
    const [savingGrant, setSavingGrant] = useState(false);
    const [overview, setOverview] = useState<Overview | null>(null);
    const [organisations, setOrganisations] = useState<Organisation[]>([]);
    const [orgForm, setOrgForm] = useState({
        name: "",
        slug: "",
        contactEmail: "",
        monthlyAiCredits: "",
        monthlyHuddleMinutes: "",
        dailyHuddleStarts: "",
        maxMinutesPerHuddle: "90",
    });
    const [seatForm, setSeatForm] = useState({
        organisationId: "",
        userId: "",
        role: "member",
    });
    const [grantForm, setGrantForm] = useState({
        userId: "",
        aiCredits: "",
        huddleMinutes: "",
        note: "",
    });

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [nextOverview, orgs] = await Promise.all([
                adminApi.getBillingOverview(),
                adminApi.listOrganisations(),
            ]);
            setOverview(nextOverview || {});
            setOrganisations(Array.isArray(orgs?.items) ? orgs.items : []);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    const submitOrganisation = async () => {
        setSavingOrg(true);
        try {
            await adminApi.upsertOrganisation(orgForm);
            setOrgForm({
                name: "",
                slug: "",
                contactEmail: "",
                monthlyAiCredits: "",
                monthlyHuddleMinutes: "",
                dailyHuddleStarts: "",
                maxMinutesPerHuddle: "90",
            });
            await load();
        } finally {
            setSavingOrg(false);
        }
    };

    const submitSeat = async () => {
        setSavingSeat(true);
        try {
            await adminApi.assignOrganisationSeat(seatForm);
            setSeatForm({ organisationId: "", userId: "", role: "member" });
            await load();
        } finally {
            setSavingSeat(false);
        }
    };

    const submitGrant = async () => {
        setSavingGrant(true);
        try {
            await adminApi.grantManualBoost(grantForm);
            setGrantForm({ userId: "", aiCredits: "", huddleMinutes: "", note: "" });
            await load();
        } finally {
            setSavingGrant(false);
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-display text-gray-900 dark:text-gray-100">Monetization</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Monitor plans, enterprise organisations, usage, boosts, and manual overrides.</p>
            </div>

            {loading ? (
                <div className="rounded-2xl border border-border bg-surface p-6 text-sm text-gray-500 dark:bg-dark dark:border-gray-800 dark:text-gray-400">
                    Loading monetization overview...
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
                        <StatCard label="Revenue" value={`£${Number(overview?.revenue || 0).toFixed(2)}`} note="Validated purchases recorded" />
                        <StatCard label="AI Credits Used" value={overview?.aiCreditsUsed || 0} />
                        <StatCard label="Huddle Minutes Used" value={overview?.huddleMinutesUsed || 0} />
                        <StatCard label="Boost Purchases" value={overview?.boostPurchases || 0} />
                        <StatCard label="Organisations" value={overview?.organisations || 0} />
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <StatCard label="Free Users" value={overview?.plans?.free || 0} />
                        <StatCard label="Pro Users" value={overview?.plans?.pro || 0} />
                        <StatCard label="Premium Users" value={overview?.plans?.premium || 0} />
                        <StatCard label="Enterprise Users" value={overview?.plans?.enterprise || 0} />
                    </div>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm dark:bg-dark dark:border-gray-800">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Create Organisation</h3>
                            <div className="mt-4 space-y-3">
                                <input className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white" placeholder="Name" value={orgForm.name} onChange={(e) => setOrgForm((prev) => ({ ...prev, name: e.target.value }))} />
                                <input className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white" placeholder="Slug" value={orgForm.slug} onChange={(e) => setOrgForm((prev) => ({ ...prev, slug: e.target.value }))} />
                                <input className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white" placeholder="Contact email" value={orgForm.contactEmail} onChange={(e) => setOrgForm((prev) => ({ ...prev, contactEmail: e.target.value }))} />
                                <input className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white" placeholder="Monthly AI credits" value={orgForm.monthlyAiCredits} onChange={(e) => setOrgForm((prev) => ({ ...prev, monthlyAiCredits: e.target.value }))} />
                                <input className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white" placeholder="Monthly huddle minutes" value={orgForm.monthlyHuddleMinutes} onChange={(e) => setOrgForm((prev) => ({ ...prev, monthlyHuddleMinutes: e.target.value }))} />
                                <input className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white" placeholder="Daily huddle starts" value={orgForm.dailyHuddleStarts} onChange={(e) => setOrgForm((prev) => ({ ...prev, dailyHuddleStarts: e.target.value }))} />
                                <input className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white" placeholder="Max minutes per huddle" value={orgForm.maxMinutesPerHuddle} onChange={(e) => setOrgForm((prev) => ({ ...prev, maxMinutesPerHuddle: e.target.value }))} />
                                <button onClick={submitOrganisation} disabled={savingOrg} className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
                                    {savingOrg ? "Saving..." : "Save organisation"}
                                </button>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm dark:bg-dark dark:border-gray-800">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Assign Enterprise Seat</h3>
                            <div className="mt-4 space-y-3">
                                <select className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white" value={seatForm.organisationId} onChange={(e) => setSeatForm((prev) => ({ ...prev, organisationId: e.target.value }))}>
                                    <option value="">Select organisation</option>
                                    {organisations.map((org) => (
                                        <option key={org.id} value={org.id}>{org.name}</option>
                                    ))}
                                </select>
                                <input className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white" placeholder="User ID" value={seatForm.userId} onChange={(e) => setSeatForm((prev) => ({ ...prev, userId: e.target.value }))} />
                                <select className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white" value={seatForm.role} onChange={(e) => setSeatForm((prev) => ({ ...prev, role: e.target.value }))}>
                                    <option value="member">Member</option>
                                    <option value="coach">Coach</option>
                                    <option value="admin">Admin</option>
                                </select>
                                <button onClick={submitSeat} disabled={savingSeat} className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
                                    {savingSeat ? "Assigning..." : "Assign seat"}
                                </button>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm dark:bg-dark dark:border-gray-800">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Manual Boost Override</h3>
                            <div className="mt-4 space-y-3">
                                <input className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white" placeholder="User ID" value={grantForm.userId} onChange={(e) => setGrantForm((prev) => ({ ...prev, userId: e.target.value }))} />
                                <input className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white" placeholder="AI credits" value={grantForm.aiCredits} onChange={(e) => setGrantForm((prev) => ({ ...prev, aiCredits: e.target.value }))} />
                                <input className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white" placeholder="Huddle minutes" value={grantForm.huddleMinutes} onChange={(e) => setGrantForm((prev) => ({ ...prev, huddleMinutes: e.target.value }))} />
                                <input className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white" placeholder="Note" value={grantForm.note} onChange={(e) => setGrantForm((prev) => ({ ...prev, note: e.target.value }))} />
                                <button onClick={submitGrant} disabled={savingGrant} className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
                                    {savingGrant ? "Applying..." : "Grant override"}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-border bg-surface shadow-sm dark:bg-dark dark:border-gray-800">
                        <div className="border-b border-border px-6 py-4 dark:border-gray-800">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Enterprise Organisations</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-100 text-sm dark:divide-gray-800">
                                <thead>
                                    <tr className="text-left text-gray-500">
                                        <th className="px-6 py-4 font-semibold">Organisation</th>
                                        <th className="px-6 py-4 font-semibold">Contact</th>
                                        <th className="px-6 py-4 font-semibold">Seats</th>
                                        <th className="px-6 py-4 font-semibold">AI Limit</th>
                                        <th className="px-6 py-4 font-semibold">Huddle Limit</th>
                                        <th className="px-6 py-4 font-semibold">Session Cap</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {organisations.map((org) => (
                                        <tr key={org.id}>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900 dark:text-gray-100">{org.name}</div>
                                                <div className="text-xs text-gray-500">{org.slug}</div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{org.contactEmail || "—"}</td>
                                            <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{org.activeSeatCount} active / {org.seatCount} total</td>
                                            <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{String(org.config?.monthly_ai_credits ?? "Custom")}</td>
                                            <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{String(org.config?.monthly_huddle_minutes ?? "Custom")}</td>
                                            <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{String(org.config?.max_minutes_per_huddle ?? "90")}</td>
                                        </tr>
                                    ))}
                                    {organisations.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">No organisations yet.</td>
                                        </tr>
                                    ) : null}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
