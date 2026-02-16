import { ChangeEvent } from "react";

export type SyrupFormState = {
  flavor: string;
  quantity: number;
};

type AddSyrupFormProps = {
  value: SyrupFormState;
  onChange: (next: SyrupFormState) => void;
  onSubmit: () => void;
};

export default function AddSyrupForm({
  value,
  onChange,
  onSubmit,
}: AddSyrupFormProps) {
  const handleTextChange = (key: "flavor") =>
    (event: ChangeEvent<HTMLInputElement>) => {
      onChange({ ...value, [key]: event.target.value });
    };

  return (
    <div className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-[0_20px_45px_-35px_rgba(15,23,42,0.25)] backdrop-blur">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold">Dodaj nową referencję</h2>
        <span className="rounded-full bg-orange-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-orange-600">
          Formularz
        </span>
      </div>
      <p className="mt-2 text-sm text-zinc-500">
        Uzupełnij dane syropu, aby dodać go do magazynu lub zwiększyć istniejący
        stan.
      </p>
      <div className="mt-6 space-y-5">
        <div>
          <label className="text-xs font-semibold uppercase text-zinc-500">
            Smak
          </label>
          <input
            value={value.flavor}
            onChange={handleTextChange("flavor")}
            className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white/80 px-4 py-3 text-sm shadow-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
            placeholder="np. Marakuja"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase text-zinc-500">
            Ilość startowa
          </label>
          <input
            type="number"
            min={0}
            value={value.quantity}
            onChange={(event) =>
              onChange({ ...value, quantity: Number(event.target.value) })
            }
            className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white/80 px-4 py-3 text-sm shadow-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
          />
        </div>
        <button
          onClick={onSubmit}
          className="mt-2 w-full rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-200 transition hover:from-orange-400 hover:to-amber-400"
        >
          Dodaj do magazynu
        </button>
      </div>
    </div>
  );
}
