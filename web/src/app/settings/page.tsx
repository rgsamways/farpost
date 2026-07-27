import PageHeader from "@/components/PageHeader";
import SectionHeader from "@/components/SectionHeader";
import FontSizeSetting from "@/components/settings/FontSizeSetting";
import ReducedMotionSetting from "@/components/settings/ReducedMotionSetting";

export default function SettingsPage() {
  return (
    <>
      <PageHeader kicker="Farpost" title="Settings" />

      <SectionHeader title="FONT SIZE" />
      <p className="mb-4 text-sm leading-relaxed text-muted">
        Scales all text on the site proportionally — applied immediately and everywhere, not just
        here.
      </p>
      <FontSizeSetting />

      <SectionHeader title="REDUCED MOTION" />
      <p className="mb-4 text-sm leading-relaxed text-muted">
        System follows your OS&rsquo;s reduced-motion setting; On or Off overrides it either way.
        Actually disables the mobile nav&rsquo;s slide-in and this page&rsquo;s
        scroll-to-section, not just a stored flag.
      </p>
      <ReducedMotionSetting />
    </>
  );
}
