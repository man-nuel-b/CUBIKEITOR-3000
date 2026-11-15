document.addEventListener('DOMContentLoaded', () => {
    const exportCsvBtn = document.getElementById('export-csv-btn');
    const printBtn = document.getElementById('print-btn');
    const visualBox = document.getElementById('visual-container-box');

    function calculateCubicacion() {
        const length = parseFloat(document.getElementById('room-length').value) || 0;
        const width = parseFloat(document.getElementById('room-width').value) || 0;
        const height = parseFloat(document.getElementById('room-height').value) || 0;
        const wastePct = parseFloat(document.getElementById('waste-pct').value) || 0;
        const unitPrice = parseFloat(document.getElementById('unit-price').value) || 0;
        const materialType = document.getElementById('material-type').value;

        // Cálculo paramétrico de superficies de recinto (Pisos + Muros perimetrales)
        const floorArea = length * width;
        const wallsArea = 2 * (length + width) * height;
        const totalArea = floorArea + wallsArea;

        // Cobertura estimada por unidad según tipo de material plano
        let coveragePerUnit = 2.98; // Plancha estándar (2.44 x 1.22m)
        if (materialType === 'ceramica') {
            coveragePerUnit = 0.36;
        } else if (materialType === 'panel_comercial') {
            coveragePerUnit = 2.0;
        }

        const netUnits = totalArea / coveragePerUnit;
        const unitsWithWaste = Math.ceil(netUnits * (1 + wastePct / 100));
        const totalPrice = unitsWithWaste * unitPrice;

        // Actualización dinámica de la Interfaz
        document.getElementById('res-area').textContent = totalArea.toFixed(2) + ' m²';
        document.getElementById('res-units').textContent = unitsWithWaste + ' Unidades';
        document.getElementById('res-total').textContent = '$' + totalPrice.toLocaleString('es-CL');

        document.getElementById('preview-title').textContent = `Recinto: ${length.toFixed(2)}m x ${width.toFixed(2)}m x ${height.toFixed(2)}m`;
        document.getElementById('preview-subtitle').textContent = `Área total envolvente: ${totalArea.toFixed(2)} m²`;
        document.getElementById('box-dimensions-label').textContent = `${length.toFixed(1)}m × ${width.toFixed(1)}m`;

        // Renderizado visual a escala dentro del visor gráfico
        const maxBoxWidth = 280;
        const maxBoxHeight = 220;
        const maxDim = Math.max(length, width, 1);

        const renderWidth = Math.max(80, (length / maxDim) * maxBoxWidth);
        const renderHeight = Math.max(60, (width / maxDim) * maxBoxHeight);

        visualBox.style.width = `${renderWidth}px`;
        visualBox.style.height = `${renderHeight}px`;
    }

    document.querySelectorAll('input, select').forEach(element => {
        element.addEventListener('input', calculateCubicacion);
    });

    exportCsvBtn.addEventListener('click', () => {
        const csvContent = "data:text/csv;charset=utf-8,Parametro,Valor\n" +
            "Superficie Total," + document.getElementById("res-area").textContent + "\n" +
            "Unidades Estimadas," + document.getElementById("res-units").textContent + "\n" +
            "Costo Total," + document.getElementById("res-total").textContent;

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "BOM_Cubikeitor3000.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    printBtn.addEventListener('click', () => {
        window.print();
    });

    calculateCubicacion();
});
