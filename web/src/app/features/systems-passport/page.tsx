"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import SectionHeader from "@/components/SectionHeader";
import SegmentedDateInput from "@/components/SegmentedDateInput";
import { authClient } from "@/lib/auth-client";
import { apiFetch } from "@/lib/api-client";

interface Building {
  id: string;
  slug: string;
  address: string | null;
}

interface Asset {
  id: string;
  assetType: string;
  label: string | null;
  manufacturer: string | null;
  model: string | null;
  serialNumber: string | null;
  location: string | null;
  installedDate: string | null;
  lastServicedDate: string | null;
  warrantyExpiryDate: string | null;
  conditionStatus: string | null;
  conditionNotes: string[] | null;
  photoUrls: string[] | null;
}

type AssetPatch = Partial<
  Omit<Asset, "id" | "assetType" | "conditionNotes" | "photoUrls"> & {
    conditionNotes: string[];
    photoUrls: string[];
  }
>;

const inputClass =
  "mt-1 block w-full rounded-md border border-foreground/20 bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none";

export default function SystemsPassportPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [newAssetType, setNewAssetType] = useState("");

  useEffect(() => {
    if (!isPending && !session) {
      router.replace("/sign-in");
    }
  }, [isPending, session, router]);

  useEffect(() => {
    if (!session) return;
    apiFetch("/api/buildings")
      .then((res) => res.json())
      .then((rows: Building[]) => {
        setBuildings(rows);
        if (rows.length === 1) setSelectedBuildingId(rows[0].id);
      });
  }, [session]);

  useEffect(() => {
    if (!selectedBuildingId) return;
    apiFetch(`/api/buildings/${selectedBuildingId}/assets`)
      .then((res) => res.json())
      .then(setAssets);
  }, [selectedBuildingId]);

  async function handleAddAsset() {
    if (!selectedBuildingId || !newAssetType) return;
    const res = await apiFetch(`/api/buildings/${selectedBuildingId}/assets`, {
      method: "POST",
      body: JSON.stringify({ assetType: newAssetType }),
    });
    const created = await res.json();
    setAssets((current) => [...current, created]);
    setNewAssetType("");
  }

  // Updates local state immediately (so typing feels responsive) and
  // persists on top — callers decide the moment to persist (onBlur for
  // free text, onChange for selects/dates, which already only fire on a
  // complete, meaningful value).
  function updateAssetLocally(assetId: string, patch: AssetPatch) {
    setAssets((current) =>
      current.map((asset) => (asset.id === assetId ? { ...asset, ...patch } : asset)),
    );
  }

  async function persistAsset(assetId: string, patch: AssetPatch) {
    const res = await apiFetch(`/api/assets/${assetId}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
    const updated = await res.json();
    setAssets((current) => current.map((asset) => (asset.id === assetId ? updated : asset)));
  }

  if (!session) return null;

  return (
    <>
      <PageHeader kicker="Farpost" title="Systems Passport" />

      <SectionHeader title="Building" />
      {buildings.length === 0 && (
        <p className="text-sm leading-relaxed text-muted">
          No buildings found — you need an active owner stake on a building to use this feature.
        </p>
      )}
      {buildings.length > 1 && (
        <select
          value={selectedBuildingId ?? ""}
          onChange={(event) => setSelectedBuildingId(event.target.value)}
          className="rounded-md border border-foreground/20 bg-background px-3 py-2 text-sm"
        >
          <option value="" disabled>
            Select a building
          </option>
          {buildings.map((building) => (
            <option key={building.id} value={building.id}>
              {building.address ?? building.slug}
            </option>
          ))}
        </select>
      )}
      {buildings.length === 1 && (
        <p className="text-sm text-muted">{buildings[0].address ?? buildings[0].slug}</p>
      )}

      {selectedBuildingId && (
        <>
          <SectionHeader title="Tracked Systems" />
          {assets.length === 0 && (
            <p className="mb-4 text-sm leading-relaxed text-muted">
              No systems tracked yet — add one below.
            </p>
          )}
          <ul className="mb-6 space-y-6">
            {assets.map((asset) => (
              <li key={asset.id} className="rounded-lg border border-foreground/20 p-5">
                <div className="flex items-start justify-between gap-3">
                  <input
                    type="text"
                    defaultValue={asset.label ?? ""}
                    placeholder={asset.assetType}
                    onBlur={(event) => persistAsset(asset.id, { label: event.target.value })}
                    className="w-full rounded-md border border-transparent bg-transparent px-0 py-1 text-base font-semibold focus:border-foreground/20 focus:bg-background focus:px-2 focus:outline-none"
                  />
                  <span className="mt-1 shrink-0 rounded-full bg-foreground/10 px-2.5 py-1 text-xs uppercase tracking-wide text-muted">
                    {asset.assetType}
                  </span>
                </div>

                <hr className="my-4 border-t border-foreground/10" />

                <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-xs text-muted">Manufacturer</span>
                    <input
                      type="text"
                      defaultValue={asset.manufacturer ?? ""}
                      onBlur={(event) => persistAsset(asset.id, { manufacturer: event.target.value })}
                      className={inputClass}
                    />
                  </label>

                  <label className="block">
                    <span className="text-xs text-muted">Model</span>
                    <input
                      type="text"
                      defaultValue={asset.model ?? ""}
                      onBlur={(event) => persistAsset(asset.id, { model: event.target.value })}
                      className={inputClass}
                    />
                  </label>

                  <label className="block">
                    <span className="text-xs text-muted">Serial number</span>
                    <input
                      type="text"
                      defaultValue={asset.serialNumber ?? ""}
                      onBlur={(event) => persistAsset(asset.id, { serialNumber: event.target.value })}
                      className={inputClass}
                    />
                  </label>

                  <label className="block">
                    <span className="text-xs text-muted">Location</span>
                    <input
                      type="text"
                      defaultValue={asset.location ?? ""}
                      placeholder="e.g. basement, attic"
                      onBlur={(event) => persistAsset(asset.id, { location: event.target.value })}
                      className={inputClass}
                    />
                  </label>

                  <SegmentedDateInput
                    label="Installed"
                    value={asset.installedDate}
                    onChange={(isoDate) => {
                      updateAssetLocally(asset.id, { installedDate: isoDate || null });
                      persistAsset(asset.id, { installedDate: isoDate });
                    }}
                  />

                  <SegmentedDateInput
                    label="Last serviced"
                    value={asset.lastServicedDate}
                    onChange={(isoDate) => {
                      updateAssetLocally(asset.id, { lastServicedDate: isoDate || null });
                      persistAsset(asset.id, { lastServicedDate: isoDate });
                    }}
                  />

                  <SegmentedDateInput
                    label="Warranty expiry"
                    value={asset.warrantyExpiryDate}
                    onChange={(isoDate) => {
                      updateAssetLocally(asset.id, { warrantyExpiryDate: isoDate || null });
                      persistAsset(asset.id, { warrantyExpiryDate: isoDate });
                    }}
                  />

                  <label className="block">
                    <span className="text-xs text-muted">Condition</span>
                    <select
                      value={asset.conditionStatus ?? ""}
                      onChange={(event) => {
                        updateAssetLocally(asset.id, { conditionStatus: event.target.value });
                        persistAsset(asset.id, { conditionStatus: event.target.value });
                      }}
                      className={inputClass}
                    >
                      <option value="">Unknown</option>
                      <option value="good">Good</option>
                      <option value="fair">Fair</option>
                      <option value="needs_repair">Needs repair</option>
                    </select>
                  </label>
                </div>

                <label className="mt-4 block">
                  <span className="text-xs text-muted">Condition notes</span>
                  <textarea
                    defaultValue={(asset.conditionNotes ?? []).join("\n")}
                    placeholder="One note per line"
                    rows={2}
                    onBlur={(event) => {
                      const notes = event.target.value
                        .split("\n")
                        .map((note) => note.trim())
                        .filter(Boolean);
                      persistAsset(asset.id, { conditionNotes: notes });
                    }}
                    className={`${inputClass} resize-y`}
                  />
                </label>

                <label className="mt-4 block">
                  <span className="text-xs text-muted">Photo URLs</span>
                  <input
                    type="text"
                    defaultValue={(asset.photoUrls ?? []).join(", ")}
                    placeholder="Comma-separated links"
                    onBlur={(event) => {
                      const urls = event.target.value
                        .split(",")
                        .map((url) => url.trim())
                        .filter(Boolean);
                      persistAsset(asset.id, { photoUrls: urls });
                    }}
                    className={inputClass}
                  />
                </label>
              </li>
            ))}
          </ul>

          <div className="flex items-end gap-2">
            <label className="text-xs text-muted">
              Add a system
              <input
                type="text"
                value={newAssetType}
                onChange={(event) => setNewAssetType(event.target.value)}
                placeholder="e.g. roof, furnace, water_heater"
                className="mt-1 block rounded-md border border-foreground/20 bg-background px-3 py-2 text-sm"
              />
            </label>
            <button
              type="button"
              onClick={handleAddAsset}
              disabled={!newAssetType}
              className="rounded-md border border-foreground/20 px-4 py-2 text-sm font-semibold text-muted transition hover:border-accent hover:text-accent disabled:opacity-40"
            >
              Add
            </button>
          </div>
        </>
      )}
    </>
  );
}
