"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import SectionHeader from "@/components/SectionHeader";
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
  installedDate: string | null;
  warrantyExpiryDate: string | null;
  conditionStatus: string | null;
}

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

  async function handleConditionChange(assetId: string, conditionStatus: string) {
    const res = await apiFetch(`/api/assets/${assetId}`, {
      method: "PATCH",
      body: JSON.stringify({ conditionStatus }),
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
          <ul className="mb-6 space-y-3">
            {assets.map((asset) => (
              <li
                key={asset.id}
                className="rounded-md border border-foreground/20 p-3 text-sm"
              >
                <p className="font-semibold">{asset.label ?? asset.assetType}</p>
                <p className="text-muted">
                  {asset.manufacturer} {asset.model}
                </p>
                <label className="mt-2 block text-xs text-muted">
                  Condition
                  <select
                    value={asset.conditionStatus ?? ""}
                    onChange={(event) => handleConditionChange(asset.id, event.target.value)}
                    className="mt-1 block rounded-md border border-foreground/20 bg-background px-2 py-1 text-sm"
                  >
                    <option value="">Unknown</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="needs_repair">Needs repair</option>
                  </select>
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
