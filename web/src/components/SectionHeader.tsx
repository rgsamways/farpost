import { cache } from "react";
import { resolveUniqueSlug } from "@/lib/slugify";

const getUsedSlugsForThisPage = cache(() => new Set<string>());

export default function SectionHeader({ title }: { title: string }) {
  const id = resolveUniqueSlug(title, getUsedSlugsForThisPage());
  return (
    <div className="section-heading-row mb-4 mt-10 flex items-center gap-3 rounded-md">
      <h2 id={id} className="whitespace-nowrap text-sm font-bold tracking-wide">{title}</h2>
      <hr className="flex-1 border-t border-accent" />
    </div>
  );
}
