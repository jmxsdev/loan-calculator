import * as XLSX from 'xlsx';

/**
 * Generates and downloads an Excel file from the amortization table data.
 * @param {Array<Object>} amortizationTableData - The array of amortization data rows.
 * @param {Object} options - The loan options from the form.
 * @param {HTMLElement} form - The form element to get selected text.
 */
export function generateExcelReport(amortizationTableData, options, form) {
    if (amortizationTableData.length === 0) {
        alert('Primero debes calcular la tabla de amortización.');
        return;
    }

    const durationUnitSelect = form.querySelector('#duration-unit');
    const selectedUnitText = durationUnitSelect.options[durationUnitSelect.selectedIndex].text;

    const totalInterest = amortizationTableData.reduce((acc, row) => acc + row.interest, 0);
    const totalPaid = amortizationTableData.reduce((acc, row) => acc + row.payment, 0);
    
    const summary = [
        ["Resumen del Préstamo"],
        ["Importe Préstamo", options.amount],
        ["Duración", `${options.duration} ${selectedUnitText}`],
        ["Interés Nominal", `${options.interest}%`],
        ["Aporte / RS / JZ", `${options.openingFee}%`],
        ["Total Intereses", parseFloat(totalInterest.toFixed(2))],
        ["Coste Total Préstamo", parseFloat(totalPaid.toFixed(2))],
        [] // Empty row for spacing
    ];

    const header = ["Periodo", "Fecha de Pago", "Cuota", "Intereses", "Amortización", "Capital Pendiente"];
    const body = amortizationTableData.map(row => [
        row.period,
        new Date(row.paymentDate).toLocaleDateString(),
        parseFloat(row.payment.toFixed(2)),
        parseFloat(row.interest.toFixed(2)),
        parseFloat(row.principal.toFixed(2)),
        parseFloat(row.remaining.toFixed(2))
    ]);

    const ws = XLSX.utils.aoa_to_sheet([summary[0], ...summary.slice(1), header, ...body]);
    
    ws['!cols'] = [ {wch:10}, {wch:15}, {wch:15}, {wch:15}, {wch:15}, {wch:20} ];
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Amortización");
    
    XLSX.writeFile(wb, "tabla_amortizacion.xlsx");
}
