"use client";

import { useEffect, useMemo, useState } from "react";
import AddSyrupForm, { SyrupFormState } from "./components/AddSyrupForm";
import InventoryHeader from "./components/InventoryHeader";
import InventoryList from "./components/InventoryList";
import type { SyrupItem } from "./components/InventoryItem";
import { db } from "./lib/firebase";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { tahomaBase64 } from "./lib/fonts/tahoma";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

export default function Home() {
  const [inventory, setInventory] = useState<SyrupItem[]>([]);
  const [formState, setFormState] = useState<SyrupFormState>({
    flavor: "",
    quantity: 0,
  });
  const [movementQty, setMovementQty] = useState<Record<string, number>>({});

  useEffect(() => {
    const collectionRef = collection(db, "syrups");
    const inventoryQuery = query(collectionRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(inventoryQuery, (snapshot) => {
      const nextInventory = snapshot.docs.map((docSnap) => {
        const data = docSnap.data() as {
          flavor: string;
          quantity: number;
        };

        return {
          id: docSnap.id,
          flavor: data.flavor,
          quantity: data.quantity ?? 0,
        };
      });

      setInventory(nextInventory);
    });

    return () => unsubscribe();
  }, []);

  const totalBottles = useMemo(
    () => inventory.reduce((sum, item) => sum + item.quantity, 0),
    [inventory]
  );

  const lowStock = useMemo(
    () => inventory.filter((item) => item.quantity <= 6),
    [inventory]
  );

  const addNewItem = async () => {
    const trimmedFlavor = formState.flavor.trim();
    if (!trimmedFlavor) return;
    if (formState.quantity < 0) return;

    const collectionRef = collection(db, "syrups");
    const flavorLower = trimmedFlavor.toLowerCase();

    try {
      const existingSnapshot = await getDocs(
        query(collectionRef, where("flavorLower", "==", flavorLower))
      );

      if (!existingSnapshot.empty) {
        const existingDoc = existingSnapshot.docs[0];
        const existingQuantity =
          (existingDoc.data().quantity as number | undefined) ?? 0;

        await updateDoc(existingDoc.ref, {
          flavor: trimmedFlavor,
          flavorLower,
          quantity: existingQuantity + formState.quantity,
        });
      } else {
        await addDoc(collectionRef, {
          flavor: trimmedFlavor,
          flavorLower,
          quantity: formState.quantity,
          createdAt: serverTimestamp(),
        });
      }

      setFormState({
        flavor: "",
        quantity: 0,
      });
    } catch (error) {
      console.error("Błąd zapisu do Firebase:", error);
    }
  };

  const adjustStock = async (id: string, direction: "add" | "remove") => {
    const qty = movementQty[id] ?? 0;
    if (qty <= 0) return;

    const target = inventory.find((item) => item.id === id);
    if (!target) return;

    const delta = direction === "add" ? qty : -qty;
    const nextQty = Math.max(0, target.quantity + delta);

    try {
      await updateDoc(doc(db, "syrups", id), {
        quantity: nextQty,
      });
      setMovementQty((prev) => ({ ...prev, [id]: 0 }));
    } catch (error) {
      console.error("Błąd aktualizacji stanu:", error);
    }
  };

  const exportInventoryPdf = () => {
    const doc = new jsPDF();
    const generatedAt = new Date();

    doc.addFileToVFS("Tahoma.ttf", tahomaBase64);
    doc.addFont("Tahoma.ttf", "Tahoma", "normal");
    doc.setFont("Tahoma", "normal");

    doc.setFontSize(16);
    doc.text("Inwentaryzacja syropów Frutta Max", 14, 18);

    doc.setFontSize(10);
    doc.setTextColor(90);
    doc.text(
      `Wygenerowano: ${generatedAt.toLocaleString("pl-PL")}`,
      14,
      26
    );
    doc.text(`Łącznie butelek: ${totalBottles}`, 14, 32);
    doc.text("Pojemność butelki: 0.5 L", 14, 38);

    const rows = inventory.map((item, index) => [
      String(index + 1),
      item.flavor,
      String(item.quantity),
    ]);

    const rowsWithCheckbox = rows.map((row) => ["☐", ...row]);

    autoTable(doc, {
      startY: 44,
      head: [["✓", "#", "Smak", "Ilość"]],
      body: rowsWithCheckbox,
      styles: {
        font: "Tahoma",
        fontStyle: "normal",
        fontSize: 10,
        cellPadding: 3,
      },
      headStyles: {
        font: "Tahoma",
        fontStyle: "normal",
        fillColor: [234, 88, 12],
        textColor: [255, 255, 255],
      },
      alternateRowStyles: {
        fillColor: [252, 243, 236],
      },
      columnStyles: {
        0: { halign: "center", cellWidth: 15 },
      },
    });

    const fileName = `inwentaryzacja-syropow-${generatedAt
      .toISOString()
      .slice(0, 10)}.pdf`;
    doc.save(fileName);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 text-zinc-900">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,237,213,0.7),_transparent_55%)]" />
      <main className="relative mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:gap-10 sm:px-6 sm:py-12">
        <InventoryHeader
          totalBottles={totalBottles}
          lowStockCount={lowStock.length}
        />

        <section className="grid gap-6 lg:grid-cols-[1.2fr_2fr]">
          <AddSyrupForm
            value={formState}
            onChange={setFormState}
            onSubmit={addNewItem}
          />
          <InventoryList
            items={inventory}
            movementQty={movementQty}
            onChangeMovement={(id, value) =>
              setMovementQty((prev) => ({ ...prev, [id]: value }))
            }
            onAdd={(id) => adjustStock(id, "add")}
            onRemove={(id) => adjustStock(id, "remove")}
            onExport={exportInventoryPdf}
          />
        </section>
      </main>
    </div>
  );
}
