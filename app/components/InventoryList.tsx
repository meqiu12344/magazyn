import InventoryItem, { SyrupItem } from "./InventoryItem";

type InventoryListProps = {
  items: SyrupItem[];
  movementQty: Record<string, number>;
  onChangeMovement: (id: string, value: number) => void;
  onAdd: (id: string) => void;
  onRemove: (id: string) => void;
  onExport: () => void;
};

export default function InventoryList({
  items,
  movementQty,
  onChangeMovement,
  onAdd,
  onRemove,
  onExport,
}: InventoryListProps) {
  return (
    <div className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-[0_20px_45px_-35px_rgba(15,23,42,0.25)] backdrop-blur">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <h2 className="text-lg font-semibold">Stan magazynowy</h2>
          <span className="w-fit rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-600">
            {items.length} referencji
          </span>
        </div>
        <button
          onClick={onExport}
          className="w-full rounded-2xl border border-orange-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-orange-600 shadow-sm transition hover:border-orange-300 hover:bg-orange-50 sm:w-auto"
        >
          Eksportuj PDF
        </button>
      </div>
      <div className="mt-6 space-y-5">
        {items.map((item) => (
          <InventoryItem
            key={item.id}
            item={item}
            movementValue={movementQty[item.id] ?? 0}
            onChangeMovement={onChangeMovement}
            onAdd={onAdd}
            onRemove={onRemove}
          />
        ))}
      </div>
    </div>
  );
}
