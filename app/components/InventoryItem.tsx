export type SyrupItem = {
  id: string;
  flavor: string;
  quantity: number;
};

type InventoryItemProps = {
  item: SyrupItem;
  movementValue: number;
  onChangeMovement: (id: string, value: number) => void;
  onAdd: (id: string) => void;
  onRemove: (id: string) => void;
};

export default function InventoryItem({
  item,
  movementValue,
  onChangeMovement,
  onAdd,
  onRemove,
}: InventoryItemProps) {
  return (
    <div className="rounded-2xl border border-zinc-100 bg-gradient-to-br from-white to-zinc-50 p-4 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-lg font-semibold">{item.flavor}</p>
          <p className="mt-1 text-xs uppercase text-zinc-400">Butelka 0.5 L</p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:gap-4">
          <div className="rounded-2xl bg-white px-4 py-2 text-center shadow-sm sm:text-left">
            <p className="text-[10px] uppercase tracking-widest text-zinc-400">
              Ilość
            </p>
            <p className="text-xl font-semibold text-zinc-900">{item.quantity}</p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <input
              type="number"
              min={0}
              value={movementValue}
              onChange={(event) =>
                onChangeMovement(item.id, Number(event.target.value))
              }
              className="w-full rounded-xl border border-zinc-200 bg-white/80 px-3 py-2 text-sm shadow-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200 sm:w-20"
            />
            <button
              onClick={() => onAdd(item.id)}
              className="w-full rounded-xl bg-emerald-500 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-400 sm:w-auto"
            >
              Dodaj
            </button>
            <button
              onClick={() => onRemove(item.id)}
              className="w-full rounded-xl bg-rose-500 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-400 sm:w-auto"
            >
              Wydaj
            </button>
          </div>
        </div>
      </div>
      {item.quantity <= 6 && (
        <p className="mt-3 w-fit rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-500">
          Niski stan — zaplanuj uzupełnienie.
        </p>
      )}
    </div>
  );
}
