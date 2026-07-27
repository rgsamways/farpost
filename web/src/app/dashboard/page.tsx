import PageHeader from "@/components/PageHeader";
import SectionHeader from "@/components/SectionHeader";

export default function DashboardPage() {
  return (
    <>
      <PageHeader kicker="Farpost" title="Dashboard" />

      <SectionHeader title="Open Jobs" />
      <p className="text-sm leading-relaxed text-muted">
        No jobs yet — this is the first real page built on the new shell, not a fully wired
        dashboard. Real job data lands in a later change.
      </p>

      <SectionHeader title="Recent Buildings" />
      <p className="text-sm leading-relaxed text-muted">
        Building records will surface here once the buildings module exists on this rebuild.
      </p>

      <SectionHeader title="Account" />
      <p className="text-sm leading-relaxed text-muted">
        Billing and team management placeholders — wired once better-auth and billing exist.
      </p>
    </>
  );
}
