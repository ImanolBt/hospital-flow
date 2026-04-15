import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

function ReportesPDF({ pacientes, recursos }) {
  const [generando, setGenerando] = useState(false);

  // Generar reporte completo del sistema
  const generarReporteCompleto = () => {
    setGenerando(true);
    
    const doc = new jsPDF();
    const fechaActual = new Date().toLocaleDateString('es-EC', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Configuración de colores
    const colorPrimario = [102, 126, 234];
    const colorSecundario = [118, 75, 162];

    // PÁGINA 1 - PORTADA
    doc.setFillColor(...colorPrimario);
    doc.rect(0, 0, 210, 80, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.text('REPORTE HOSPITALARIO', 105, 30, { align: 'center' });
    
    doc.setFontSize(16);
    doc.text('Sistema de Optimización de Flujo', 105, 45, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(fechaActual, 105, 60, { align: 'center' });

    // Resumen ejecutivo
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(18);
    doc.text('RESUMEN EJECUTIVO', 20, 100);
    
    doc.setFontSize(12);
    const recursosDisponibles = recursos.filter(r => r.disponible).length;
    const recursosOcupados = recursos.length - recursosDisponibles;
    const casosCriticos = pacientes.filter(p => p.prioridad === 'critica').length;
    const casosAlta = pacientes.filter(p => p.prioridad === 'alta').length;

    const resumen = [
      `Total de pacientes en espera: ${pacientes.length}`,
      `Casos criticos: ${casosCriticos}`,
      `Casos de alta prioridad: ${casosAlta}`,
      `Recursos disponibles: ${recursosDisponibles}/${recursos.length}`,
      `Recursos ocupados: ${recursosOcupados}`,
      `Tasa de ocupacion: ${Math.round((recursosOcupados/recursos.length) * 100)}%`
    ];

    let yPos = 115;
    resumen.forEach(linea => {
      doc.text(`- ${linea}`, 25, yPos);
      yPos += 10;
    });

    // TABLA DE PACIENTES
    doc.setFontSize(16);
    doc.text('PACIENTES EN ESPERA', 20, yPos + 10);
    
    const tablaPacientes = pacientes.map(p => [
      p.nombre,
      p.edad,
      p.area,
      p.prioridad.toUpperCase(),
      new Date(p.tiempo_llegada).toLocaleTimeString('es-EC')
    ]);

    autoTable(doc, {
      startY: yPos + 20,
      head: [['Nombre', 'Edad', 'Area', 'Prioridad', 'Hora Llegada']],
      body: tablaPacientes,
      headStyles: { 
        fillColor: colorPrimario,
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      didParseCell: function(data) {
        if (data.column.index === 3 && data.section === 'body') {
          const prioridad = data.cell.raw;
          if (prioridad === 'CRITICA') {
            data.cell.styles.textColor = [156, 39, 176];
            data.cell.styles.fontStyle = 'bold';
          } else if (prioridad === 'ALTA') {
            data.cell.styles.textColor = [244, 67, 54];
            data.cell.styles.fontStyle = 'bold';
          } else if (prioridad === 'MEDIA') {
            data.cell.styles.textColor = [255, 152, 0];
          }
        }
      }
    });

    // NUEVA PÁGINA - RECURSOS
    doc.addPage();
    
    doc.setFillColor(...colorSecundario);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text('ESTADO DE RECURSOS', 105, 25, { align: 'center' });

    // Tabla de recursos
    doc.setTextColor(0, 0, 0);
    const tablaRecursos = recursos.map(r => [
      r.nombre,
      r.tipo.toUpperCase(),
      r.disponible ? 'DISPONIBLE' : 'OCUPADO'
    ]);

    autoTable(doc, {
      startY: 50,
      head: [['Recurso', 'Tipo', 'Estado']],
      body: tablaRecursos,
      headStyles: { 
        fillColor: colorSecundario,
        fontSize: 11,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 10 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      didParseCell: function(data) {
        if (data.column.index === 2 && data.section === 'body') {
          const estado = data.cell.raw;
          if (estado === 'DISPONIBLE') {
            data.cell.styles.textColor = [76, 175, 80];
            data.cell.styles.fontStyle = 'bold';
          } else {
            data.cell.styles.textColor = [244, 67, 54];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    });

    // ANÁLISIS POR ÁREA
    let finalY = 150;
    doc.setFontSize(16);
    doc.text('DISTRIBUCION POR AREA', 20, finalY + 20);

    const areas = ['emergencia', 'consulta', 'uci', 'cirugia'];
    const distribucionAreas = areas.map(area => {
      const cantidad = pacientes.filter(p => p.area === area).length;
      const criticos = pacientes.filter(p => p.area === area && p.prioridad === 'critica').length;
      return [area.toUpperCase(), cantidad, criticos];
    });

    autoTable(doc, {
      startY: finalY + 30,
      head: [['Area', 'Total Pacientes', 'Casos Criticos']],
      body: distribucionAreas,
      headStyles: { 
        fillColor: colorPrimario,
        fontSize: 11,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 10 },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    });

    // RECOMENDACIONES
    doc.addPage();
    doc.setFillColor(...colorPrimario);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text('RECOMENDACIONES', 105, 25, { align: 'center' });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    
    const recomendaciones = [];
    
    if (casosCriticos > 0) {
      recomendaciones.push(`URGENTE: ${casosCriticos} caso(s) critico(s) requieren atencion inmediata.`);
    }
    
    if (recursosDisponibles < 2 && pacientes.length > 3) {
      recomendaciones.push('Recursos limitados. Preparar liberacion de camas/quirofanos.');
    }
    
    areas.forEach(area => {
      const cant = pacientes.filter(p => p.area === area).length;
      if (cant > 5) {
        recomendaciones.push(`${area.toUpperCase()}: Saturacion detectada (${cant} pacientes). Reasignar personal.`);
      }
    });
    
    if (recomendaciones.length === 0) {
      recomendaciones.push('Sistema operando en condiciones optimas.');
    }

    let recY = 60;
    recomendaciones.forEach(rec => {
      const lineas = doc.splitTextToSize(rec, 170);
      doc.text(lineas, 20, recY);
      recY += (lineas.length * 7) + 5;
    });

    // Pie de página en todas las páginas
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Sistema de Optimizacion Hospitalaria - Pagina ${i} de ${pageCount}`,
        105,
        290,
        { align: 'center' }
      );
    }

    // Guardar PDF
    doc.save(`Reporte_Hospital_${new Date().getTime()}.pdf`);
    
    setGenerando(false);
    alert('Reporte PDF generado exitosamente');
  };

  // Generar reporte de pacientes únicamente
  const generarReportePacientes = () => {
    setGenerando(true);
    
    const doc = new jsPDF();
    
    doc.setFillColor(102, 126, 234);
    doc.rect(0, 0, 210, 50, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text('REPORTE DE PACIENTES', 105, 30, { align: 'center' });
    
    const tablaPacientes = pacientes.map(p => [
      p.nombre,
      p.edad,
      p.area,
      p.prioridad.toUpperCase(),
      new Date(p.tiempo_llegada).toLocaleString('es-EC')
    ]);

    autoTable(doc, {
      startY: 60,
      head: [['Nombre', 'Edad', 'Area', 'Prioridad', 'Fecha/Hora Llegada']],
      body: tablaPacientes,
      headStyles: { fillColor: [102, 126, 234] }
    });

    doc.save(`Pacientes_${new Date().getTime()}.pdf`);
    setGenerando(false);
    alert('Reporte de pacientes generado');
  };

  // Generar reporte de recursos
  const generarReporteRecursos = () => {
    setGenerando(true);
    
    const doc = new jsPDF();
    
    doc.setFillColor(118, 75, 162);
    doc.rect(0, 0, 210, 50, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text('REPORTE DE RECURSOS', 105, 30, { align: 'center' });
    
    const tablaRecursos = recursos.map(r => [
      r.nombre,
      r.tipo.toUpperCase(),
      r.disponible ? 'DISPONIBLE' : 'OCUPADO'
    ]);

    autoTable(doc, {
      startY: 60,
      head: [['Recurso', 'Tipo', 'Estado']],
      body: tablaRecursos,
      headStyles: { fillColor: [118, 75, 162] }
    });

    doc.save(`Recursos_${new Date().getTime()}.pdf`);
    setGenerando(false);
    alert('Reporte de recursos generado');
  };

  return (
    <div className="reportes-container">
      <div className="card">
        <h2>📄 Generador de Reportes PDF</h2>
        <p style={{marginBottom: '20px', color: '#666'}}>
          Genera reportes profesionales en formato PDF con todos los datos del sistema.
        </p>

        <div className="botones-reportes">
          <button 
            onClick={generarReporteCompleto}
            disabled={generando}
            className="btn-reporte completo"
          >
            📊 Reporte Completo
            <small>Incluye pacientes, recursos, estadisticas y recomendaciones</small>
          </button>

          <button 
            onClick={generarReportePacientes}
            disabled={generando}
            className="btn-reporte pacientes"
          >
            👥 Solo Pacientes
            <small>Lista detallada de todos los pacientes en espera</small>
          </button>

          <button 
            onClick={generarReporteRecursos}
            disabled={generando}
            className="btn-reporte recursos"
          >
            🛏️ Solo Recursos
            <small>Estado actual de camas, quirofanos y recursos</small>
          </button>
        </div>

        {generando && (
          <div className="generando-mensaje">
            ⏳ Generando reporte PDF...
          </div>
        )}
      </div>

      <div className="card info-reportes">
        <h3>ℹ️ Informacion sobre los reportes</h3>
        <ul>
          <li><strong>Reporte Completo:</strong> Documento profesional de 3 paginas con analisis completo del sistema</li>
          <li><strong>Solo Pacientes:</strong> Tabla simple con todos los pacientes en espera</li>
          <li><strong>Solo Recursos:</strong> Estado detallado de todos los recursos hospitalarios</li>
          <li>Los reportes se descargan automaticamente en tu computadora</li>
          <li>Cada reporte tiene un nombre unico con fecha y hora de generacion</li>
        </ul>
      </div>
    </div>
  );
}

export default ReportesPDF;