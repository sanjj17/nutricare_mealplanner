import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { parseGoals } from "../session";

const titleCase = (value) => String(value || "").replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

export function generatePDFReport(userData, meals) {
  if (!userData) throw new Error("Your profile is not available yet. Please reload the dashboard and try again.");
  if (!Array.isArray(meals) || meals.length === 0) throw new Error("Your weekly meal inspiration is not available yet. Please try again.");

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const goals = parseGoals(userData.goals).map(titleCase);
  const conditions = [userData.diabetes && "Diabetes", userData.bp && "Blood pressure", userData.cholesterol && "Cholesterol"].filter(Boolean);
  const reportDate = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  doc.setFillColor(39, 107, 82);
  doc.roundedRect(margin, 13, pageWidth - margin * 2, 31, 4, 4, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(19);
  doc.text("NutriCare", margin + 7, 25);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Personal wellness & weekly meal inspiration", margin + 7, 35);
  doc.setFontSize(9);
  doc.text(`Prepared ${reportDate}`, pageWidth - margin - 7, 25, { align: "right" });

  doc.setTextColor(30, 54, 45);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Your profile", margin, 56);

  autoTable(doc, {
    startY: 60,
    margin: { left: margin, right: margin },
    theme: "grid",
    head: [["Detail", "Your information"]],
    body: [
      ["Name", userData.name || "Not provided"],
      ["Email", userData.email || "Not provided"],
      ["Age", userData.age !== null && userData.age !== undefined ? `${userData.age} years` : "Not provided"],
      ["Weight", userData.weight !== null && userData.weight !== undefined ? `${userData.weight} kg` : "Not provided"],
      ["Gender", titleCase(userData.gender) || "Not provided"],
      ["Health considerations", conditions.join(", ") || "None selected"],
      ["Goals", goals.join(", ") || "Everyday wellness"],
    ],
    styles: { font: "helvetica", fontSize: 9, cellPadding: 3, textColor: [49, 66, 56], lineColor: [225, 234, 224] },
    headStyles: { fillColor: [233, 245, 236], textColor: [25, 75, 58], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [250, 251, 247] },
    columnStyles: { 0: { cellWidth: 48, fontStyle: "bold" } },
  });

  const mealStartY = (doc.lastAutoTable?.finalY || 118) + 12;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(30, 54, 45);
  doc.text("Weekly meal inspiration", margin, mealStartY);
  const mealRows = meals.flatMap((day) => [
    [day.day || "—", "Breakfast", day.breakfast || "—"],
    [day.day || "—", "Lunch", day.lunch || "—"],
    [day.day || "—", "Dinner", day.dinner || "—"],
    [day.day || "—", "Snack idea", day.snack || day.snacks || "—"],
  ]);

  autoTable(doc, {
    startY: mealStartY + 4,
    margin: { left: margin, right: margin, bottom: 18 },
    theme: "grid",
    head: [["Day", "Meal", "Suggestion"]],
    body: mealRows,
    styles: { font: "helvetica", fontSize: 8.5, cellPadding: 2.6, overflow: "linebreak", textColor: [49, 66, 56], lineColor: [225, 234, 224] },
    headStyles: { fillColor: [39, 107, 82], textColor: [255, 255, 255], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [250, 251, 247] },
    columnStyles: { 0: { cellWidth: 25, fontStyle: "bold" }, 1: { cellWidth: 32 }, 2: { cellWidth: "auto" } },
    didDrawPage: () => {
      const height = doc.internal.pageSize.getHeight();
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(110, 125, 114);
      doc.text("General wellness information only — not medical advice or a prescribed diet.", margin, height - 9);
      doc.text(`Page ${doc.internal.getNumberOfPages()}`, pageWidth - margin, height - 9, { align: "right" });
    },
  });

  doc.save("NutriCare_Wellness_Report.pdf");
  return true;
}
