document.addEventListener('DOMContentLoaded', () => {
    const calculateBtn = document.getElementById('calculate-btn');
    const exportCsvBtn = document.getElementById('export-csv-btn');
    const printBtn = document.getElementById('print-btn');

    function calculate() {
        const length = parseFloat(document.getElementById('room-length').value) || 0;
        const width = parseFloat(document.getElementById('room-width').value) || 0;
        const height = parseFloat(document.getElementById('room-height').value) || 0;
        const waste = parseFloat(document.getElementById('waste-pct').value) || 0;
        const unitPrice = parseFloat(document.getElementById('unit-price').value) || 0;

        // Cálculo de área perimetral y muros
        const floorArea = length * width;
        const wallsArea = 2 * (length + width) * height;
        const totalArea = floorArea + wallsArea;

        const areaWithWaste = totalArea * (1 + waste / 100);

        const unitsNeeded = Math.ceil(areaWithWaste / 3);
        const totalPrice = unitsNeeded * unitPrice;

        // Actualizar UI
        document.getElementById('res-area').textContent = totalArea.toFixed(2) + ' m²';
        document.getElementById('res-units').textContent = unitsNeeded + ' Unidades';
        document.getElementById('res-total').textContent = '$' + totalPrice.toLocaleString('es-CL');
        document.getElementById('preview-text').textContent = `Modelo Activo - Perímetro: ${(2*(length+width)).toFixed(2)} m | Área Total: ${totalArea.toFixed(2)} m²`;
    }

    calculateBtn.addEventListener('click', calculate);

    exportCsvBtn.addEventListener('click', () => {
        const csvContent = "data:text/csv;charset=utf-8,Parametro,Valor\n" +
            "Area Total," + document.getElementById('res-area').textContent + "\n" +
            "Unidades," + document.getElementById('res-units').textContent + "\n" +
            "Costo Total," + document.getElementById('res-total').textContent;

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "cubit_reporte.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    printBtn.addEventListener('click', () => {
        window.print();
    });

    calculate();
});
