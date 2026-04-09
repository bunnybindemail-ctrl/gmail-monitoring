"use client";

import { useState } from "react";

const previewAssets = [
  { id: "evo-ak47", name: "Evo AK47", tier: "Legendary", stock: "1000 demo units" },
  { id: "cobra-bundle", name: "Cobra Bundle", tier: "Epic", stock: "850 demo units" },
  { id: "dragon-loot", name: "Dragon Loot Box", tier: "Rare", stock: "1200 demo units" },
  { id: "diamond-drop", name: "Diamond Drop", tier: "Promo", stock: "500 demo units" },
];

const previewLines = [
  "[sandbox] FF collab endpoint placeholder ready",
  "[sandbox] Inventory mapping layer queued",
  "[sandbox] Demo claim response renderer online",
  "[sandbox] Preview mode only. No live claim is processed yet.",
];

export function ComingSoonFeaturePanel() {
  const [opened, setOpened] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState(previewAssets[0].id);
  const [demoClaimMessage, setDemoClaimMessage] = useState("");

  const selectedAsset =
    previewAssets.find((asset) => asset.id === selectedAssetId) ?? previewAssets[0];

  return (
    <section className="rounded-[2rem] border border-emerald-300 bg-[linear-gradient(180deg,#08170f,#0d2317)] p-6 text-emerald-100 shadow-[0_28px_90px_rgba(16,32,51,0.16)] sm:p-8">
      <p className="text-[0.72rem] font-bold uppercase tracking-[0.24em] text-emerald-300">
        New Features Coming Soon
      </p>
      <h2 className="mt-4 font-mono text-3xl font-semibold tracking-tight text-emerald-50">
        FF Collab Sandbox Preview
      </h2>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-emerald-100/80 sm:text-base">
        We are preparing future collab-side integrations and asset workflows.
        This section is only a sandbox preview so the final API can be plugged
        in later without redesigning the page.
      </p>

      <div className="mt-6 flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200/80">
        <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-2">
          Preview Mode
        </span>
        <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-2">
          Collab API Ready Later
        </span>
      </div>

      <div className="mt-6 rounded-[1.5rem] border border-emerald-400/20 bg-black/30 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-mono text-sm text-emerald-200">feature://claim-your-asset</p>
            <p className="mt-2 text-sm text-emerald-100/70">
              Preview only. This panel is not a real reward claim or account grant.
            </p>
          </div>
          <button
            className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-[#082010] transition hover:bg-emerald-300"
            onClick={() => setOpened((current) => !current)}
            type="button"
          >
            {opened ? "Hide preview" : "Open preview"}
          </button>
        </div>

        {opened ? (
          <div className="mt-5 rounded-[1.25rem] border border-emerald-400/20 bg-[#04110b] p-4">
            <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
              <div className="rounded-[1.25rem] border border-emerald-400/15 bg-emerald-400/5 p-4">
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-emerald-200/70">
                  Demo Asset Catalog
                </p>
                <div className="mt-4 grid gap-3">
                  {previewAssets.map((asset) => {
                    const isActive = asset.id === selectedAssetId;

                    return (
                      <button
                        className={
                          isActive
                            ? "rounded-[1.25rem] border border-emerald-300 bg-emerald-400/15 px-4 py-4 text-left transition"
                            : "rounded-[1.25rem] border border-emerald-400/15 bg-black/20 px-4 py-4 text-left transition hover:border-emerald-300/50"
                        }
                        key={asset.id}
                        onClick={() => setSelectedAssetId(asset.id)}
                        type="button"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-mono text-base font-semibold text-emerald-50">
                              {asset.name}
                            </p>
                            <p className="mt-2 text-xs uppercase tracking-[0.18em] text-emerald-200/70">
                              {asset.tier}
                            </p>
                          </div>
                          <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200/80">
                            {asset.stock}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-[1.25rem] border border-emerald-400/15 bg-emerald-400/5 p-4">
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-emerald-200/70">
                  Demo Claim Flow
                </p>
                <div className="mt-4 rounded-[1.25rem] border border-emerald-400/15 bg-black/25 p-4">
                  <p className="font-mono text-lg font-semibold text-emerald-50">
                    {selectedAsset.name}
                  </p>
                  <p className="mt-2 text-sm text-emerald-100/75">
                    Tier: {selectedAsset.tier}
                  </p>
                  <p className="mt-1 text-sm text-emerald-100/75">
                    Demo stock: {selectedAsset.stock}
                  </p>
                  <button
                    className="mt-5 rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-[#082010] transition hover:bg-emerald-300"
                    onClick={() =>
                      setDemoClaimMessage(
                        `Demo success: ${selectedAsset.name} preview rendered. Connect your real collab API later to replace this sandbox response.`,
                      )
                    }
                    type="button"
                  >
                    Run demo claim
                  </button>
                </div>

                {demoClaimMessage ? (
                  <div className="mt-4 rounded-[1.25rem] border border-emerald-300 bg-emerald-400/10 px-4 py-4">
                    <p className="font-mono text-xs uppercase tracking-[0.18em] text-emerald-200/70">
                      Sandbox Response
                    </p>
                    <p className="mt-3 text-sm leading-7 text-emerald-50">
                      {demoClaimMessage}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
              <span className="font-mono text-xs uppercase tracking-[0.22em] text-emerald-200/80">
                Terminal Preview
              </span>
            </div>
            <div className="mt-4 space-y-2 font-mono text-sm leading-7 text-emerald-200">
              {previewLines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
            <div className="mt-5 rounded-[1.25rem] border border-emerald-400/15 bg-emerald-400/5 p-4">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-emerald-200/70">
                Preview Notice
              </p>
              <p className="mt-3 text-sm leading-7 text-emerald-100/80">
                This is a coming-soon sandbox for future collab upgrades. Any
                result shown here is a demo response only and should be replaced
                by your real API once the integration is ready.
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
