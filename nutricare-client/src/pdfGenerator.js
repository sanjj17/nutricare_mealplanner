// ✅ Import jsPDF and the plugin
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // ⬅️ Use this instead of just importing as string

export const generatePDFReport = (userData) => {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text('NutriCare Health Report', 14, 22);

  doc.setFontSize(12);
  doc.text(`Name: ${userData.name || 'N/A'}`, 14, 32);
  doc.text(`Email: ${userData.email || 'N/A'}`, 14, 40);

  autoTable(doc, {
    startY: 50,
    head: [['Age', 'Gender', 'Weight', 'Conditions', 'Goals']],
    body: [
      [
        userData.age || 'N/A',
        userData.gender || 'N/A',
        userData.weight || 'N/A',
        (userData.conditions || []).join(', ') || 'None',
        (userData.goals || []).join(', ') || 'None',
      ],
    ],
  });

  doc.save('nutricare_report.pdf');
};
