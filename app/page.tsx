"use client";

import { useEffect, useMemo, useState } from "react";
import AddSyrupForm, { SyrupFormState } from "./components/AddSyrupForm";
import InventoryHeader from "./components/InventoryHeader";
import InventoryList from "./components/InventoryList";
import WzDocumentGenerator, {
  WzSelection,
  RecipientData,
} from "./components/WzDocumentGenerator";
import type { SyrupItem } from "./components/InventoryItem";
import { db } from "./lib/firebase";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import JsBarcode from "jsbarcode";
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
  const [activeTab, setActiveTab] = useState<"inventory" | "wz">("inventory");
  const [formState, setFormState] = useState<SyrupFormState>({
    flavor: "",
    ean: "",
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
          ean?: string;
          quantity: number;
        };

        return {
          id: docSnap.id,
          flavor: data.flavor,
          ean: data.ean ?? "",
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
    const trimmedEan = formState.ean.trim().replace(/\s+/g, "");
    if (!trimmedFlavor) return;
    if (formState.quantity < 0) return;
    if (trimmedEan && !/^\d{13}$/.test(trimmedEan)) {
      alert("Kod EAN musi zawierać dokładnie 13 cyfr.");
      return;
    }

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
          ean: trimmedEan || ((existingDoc.data().ean as string | undefined) ?? ""),
          quantity: existingQuantity + formState.quantity,
        });
      } else {
        await addDoc(collectionRef, {
          flavor: trimmedFlavor,
          flavorLower,
          ean: trimmedEan,
          quantity: formState.quantity,
          createdAt: serverTimestamp(),
        });
      }

      setFormState({
        flavor: "",
        ean: "",
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
      item.ean || "-",
      String(item.quantity),
    ]);

    const rowsWithCheckbox = rows.map((row) => ["☐", ...row]);

    autoTable(doc, {
      startY: 44,
      head: [["✓", "#", "Smak", "EAN", "Ilość"]],
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

  const createBarcodeDataUrl = (ean: string) => {
    const canvas = document.createElement("canvas");
    JsBarcode(canvas, ean, {
      format: "EAN13",
      displayValue: false,
      margin: 0,
      width: 1.8,
      height: 40,
    });

    return canvas.toDataURL("image/png");
  };

  const exportWzPdf = (selectedItems: WzSelection[], documentNumber: string, recipientData: RecipientData) => {
    const doc = new jsPDF();
    const generatedAt = new Date();

    doc.addFileToVFS("Tahoma.ttf", tahomaBase64);
    doc.addFont("Tahoma.ttf", "Tahoma", "normal");
    doc.setFont("Tahoma", "normal");

    doc.setFontSize(18);
    doc.text("Dokument WZ", 14, 18);

    doc.setFontSize(10);
    doc.setTextColor(90);
    doc.text(`Numer: ${documentNumber}`, 14, 26);
    doc.text(`Data wygenerowania: ${generatedAt.toLocaleString("pl-PL")}`, 14, 32);

    // Dane odbiorcy
    let y = 38;
    if (recipientData.companyName || recipientData.nip || recipientData.address) {
      doc.setFontSize(11);
      doc.setTextColor(0);
      doc.text("Odbiorca:", 14, y);
      y += 5;

      doc.setFontSize(10);
      doc.setTextColor(90);
      if (recipientData.companyName) {
        doc.text(`Nazwa: ${recipientData.companyName}`, 14, y);
        y += 4;
      }
      if (recipientData.nip) {
        doc.text(`NIP: ${recipientData.nip}`, 14, y);
        y += 4;
      }
      if (recipientData.address) {
        doc.text(`Adres: ${recipientData.address}`, 14, y);
        y += 4;
      }
      y += 2;
    }

    const rows = selectedItems.map((item, index) => [
      String(index + 1),
      item.flavor,
      item.ean,
      String(item.quantity),
    ]);

    autoTable(doc, {
      startY: y,
      head: [["#", "Produkt", "EAN", "Ilość"]],
      body: rows,
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
    });

    const tableState = doc as jsPDF & {
      lastAutoTable?: {
        finalY: number;
      };
    };

    let barcodeY = (tableState.lastAutoTable?.finalY ?? y + 20) + 10;
    doc.setTextColor(0);
    doc.setFontSize(12);
    doc.text("Kody kreskowe EAN", 14, barcodeY);
    barcodeY += 6;

    selectedItems.forEach((item, index) => {
      if (barcodeY > 250) {
        doc.addPage();
        barcodeY = 20;
      }

      doc.setFontSize(10);
      doc.text(`${index + 1}. ${item.flavor} (EAN: ${item.ean})`, 14, barcodeY);

      try {
        const barcode = createBarcodeDataUrl(item.ean);
        doc.addImage(barcode, "PNG", 14, barcodeY + 2, 70, 18);
      } catch (error) {
        console.error("Nie udało się wygenerować kodu kreskowego:", error);
        doc.setTextColor(220, 38, 38);
        doc.text("Błąd generowania kodu kreskowego", 14, barcodeY + 10);
        doc.setTextColor(0);
      }

      barcodeY += 28;
    });

    const fileName = `wz-${generatedAt.toISOString().slice(0, 10)}.pdf`;
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

        <div className="flex gap-3">
          <button
            onClick={() => setActiveTab("inventory")}
            className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
              activeTab === "inventory"
                ? "bg-orange-500 text-white shadow-lg shadow-orange-200"
                : "border border-orange-200 bg-white text-orange-600 hover:bg-orange-50"
            }`}
          >
            Magazyn
          </button>
          <button
            onClick={() => setActiveTab("wz")}
            className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
              activeTab === "wz"
                ? "bg-orange-500 text-white shadow-lg shadow-orange-200"
                : "border border-orange-200 bg-white text-orange-600 hover:bg-orange-50"
            }`}
          >
            Dokument WZ
          </button>
        </div>

        {activeTab === "inventory" ? (
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
        ) : (
          <WzDocumentGenerator items={inventory} onGenerate={exportWzPdf} />
        )}
      </main>
    </div>
  );
}
