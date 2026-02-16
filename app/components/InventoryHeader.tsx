type InventoryHeaderProps = {
  totalBottles: number;
  lowStockCount: number;
};

export default function InventoryHeader({
  totalBottles,
  lowStockCount,
}: InventoryHeaderProps) {
  return (
    <header className="flex flex-col gap-6">
      <span className="w-fit rounded-full border border-orange-200 bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-orange-600 shadow-sm">
        Frutta Max
      </span>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold leading-tight text-zinc-900 sm:text-4xl">
            Inwentaryzacja syropów
          </h1>
          <p className="mt-3 max-w-2xl text-base text-zinc-600">
            Kontroluj stan magazynowy każdej referencji. Dodawaj dostawy, odejmuj
            wysyłki do sklepów i trzymaj porządek w jednym miejscu.
          </p>
        </div>
        <div className="flex w-full flex-col gap-4 rounded-3xl border border-white/60 bg-white/80 px-6 py-4 text-center shadow-[0_20px_45px_-35px_rgba(234,88,12,0.6)] backdrop-blur sm:w-auto sm:flex-row sm:items-center sm:text-left">
          <div>
            <p className="text-xs uppercase text-zinc-500">Łącznie butelek</p>
            <p className="text-2xl font-semibold">{totalBottles}</p>
          </div>
          <div className="hidden h-10 w-px bg-zinc-200/70 sm:block" />
          <div>
            <p className="text-xs uppercase text-zinc-500">Niski stan</p>
            <p className="text-2xl font-semibold">{lowStockCount}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
