import { useMemo, useState } from "react";
import type { SyrupItem } from "./InventoryItem";

export type WzSelection = {
  id: string;
  flavor: string;
  ean: string;
  quantity: number;
};

export type RecipientData = {
  companyName: string;
  nip: string;
  address: string;
};

type WzDocumentGeneratorProps = {
  items: SyrupItem[];
  onGenerate: (selectedItems: WzSelection[], documentNumber: string, recipientData: RecipientData) => void;
};

const eanPattern = /^\d{13}$/;

export default function WzDocumentGenerator({
  items,
  onGenerate,
}: WzDocumentGeneratorProps) {
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [qty, setQty] = useState<Record<string, number>>({});
  const [documentNumber, setDocumentNumber] = useState(() => {
    const now = new Date();
    return `WZ/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${String(now.getDate()).padStart(2, "0")}-${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
  });
  const [recipientData, setRecipientData] = useState<RecipientData>({
    companyName: "",
    nip: "",
    address: "",
  });

  const selectedCount = useMemo(
    () => Object.values(selected).filter(Boolean).length,
    [selected]
  );

  const handleGenerate = () => {
    const selectedItems = items
      .filter((item) => selected[item.id])
      .map((item) => ({
        id: item.id,
        flavor: item.flavor,
        ean: item.ean,
        quantity: Math.max(1, Math.min(item.quantity, qty[item.id] ?? 1)),
      }))
      .filter((item) => eanPattern.test(item.ean));

    if (selectedItems.length === 0) {
      alert("Wybierz przynajmniej jeden produkt z poprawnym kodem EAN-13.");
      return;
    }

    onGenerate(selectedItems, documentNumber.trim() || "WZ/BEZ-NUMERU", recipientData);
  };

  return (
    <section className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-[0_20px_45px_-35px_rgba(15,23,42,0.25)] backdrop-blur">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Dokument WZ</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Wybierz produkty, ustaw ilości i wygeneruj PDF z kodami EAN oraz kodami kreskowymi.
          </p>
        </div>
        <span className="w-fit rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-600">
          {selectedCount} zaznaczonych
        </span>
      </div>

      <div className="mt-6 space-y-4">
        <div>
          <label className="text-xs font-semibold uppercase text-zinc-500">
            Numer dokumentu WZ
          </label>
          <input
            value={documentNumber}
            onChange={(event) => setDocumentNumber(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white/80 px-4 py-3 text-sm shadow-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
            placeholder="np. WZ/2026/03/06-1200"
          />
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white/50 p-4">
          <h3 className="mb-3 text-sm font-semibold text-zinc-700">Dane odbiorcy</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold uppercase text-zinc-500">
                Nazwa spółki/Odbiorca
              </label>
              <input
                type="text"
                value={recipientData.companyName}
                onChange={(event) =>
                  setRecipientData((prev) => ({
                    ...prev,
                    companyName: event.target.value,
                  }))
                }
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
                placeholder="np. ABC Sp. z o.o."
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-zinc-500">
                NIP
              </label>
              <input
                type="text"
                value={recipientData.nip}
                onChange={(event) =>
                  setRecipientData((prev) => ({
                    ...prev,
                    nip: event.target.value,
                  }))
                }
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
                placeholder="np. 1234567890"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-zinc-500">
                Adres
              </label>
              <input
                type="text"
                value={recipientData.address}
                onChange={(event) =>
                  setRecipientData((prev) => ({
                    ...prev,
                    address: event.target.value,
                  }))
                }
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
                placeholder="np. ul. Główna 10, 00-001 Warszawa"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {items.map((item) => {
          const hasValidEan = eanPattern.test(item.ean || "");
          const isDisabled = !hasValidEan || item.quantity <= 0;

          return (
            <div
              key={item.id}
              className="rounded-2xl border border-zinc-100 bg-gradient-to-br from-white to-zinc-50 p-4 shadow-sm"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selected[item.id] ?? false}
                    disabled={isDisabled}
                    onChange={(event) =>
                      setSelected((prev) => ({
                        ...prev,
                        [item.id]: event.target.checked,
                      }))
                    }
                    className="mt-1 h-4 w-4 rounded border-zinc-300 text-orange-600 focus:ring-orange-500"
                  />
                  <div>
                    <p className="text-base font-semibold text-zinc-900">{item.flavor}</p>
                    <p className="text-xs text-zinc-500">EAN: {item.ean || "Brak"}</p>
                    <p className="text-xs text-zinc-500">Dostępna ilość: {item.quantity}</p>
                    {!hasValidEan && (
                      <p className="mt-1 text-xs font-semibold text-rose-500">
                        Ten produkt nie ma poprawnego kodu EAN-13.
                      </p>
                    )}
                  </div>
                </div>

                <div className="w-full sm:w-40">
                  <label className="text-xs uppercase text-zinc-500">Ilość na WZ</label>
                  <input
                    type="number"
                    min={1}
                    max={item.quantity}
                    disabled={isDisabled || !(selected[item.id] ?? false)}
                    value={qty[item.id] ?? 1}
                    onChange={(event) =>
                      setQty((prev) => ({
                        ...prev,
                        [item.id]: Number(event.target.value),
                      }))
                    }
                    className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200 disabled:cursor-not-allowed disabled:bg-zinc-100"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={handleGenerate}
        className="mt-6 w-full rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-200 transition hover:from-orange-400 hover:to-amber-400"
      >
        Generuj dokument WZ (PDF)
      </button>
    </section>
  );
}
