import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#4caf50', '#ff9800', '#f44336', '#9c27b0'];

function Estadisticas({ pacientes, recursos }) {
  
  // Contar pacientes por área
  const pacientesPorArea = pacientes.reduce((acc, p) => {
    acc[p.area] = (acc[p.area] || 0) + 1;
    return acc;
  }, {});

  const datosArea = Object.keys(pacientesPorArea).map(area => ({
    name: area,
    cantidad: pacientesPorArea[area]
  }));

  // Contar pacientes por prioridad
  const pacientesPorPrioridad = pacientes.reduce((acc, p) => {
    acc[p.prioridad] = (acc[p.prioridad] || 0) + 1;
    return acc;
  }, {});

  const datosPrioridad = Object.keys(pacientesPorPrioridad).map((prioridad, index) => ({
    name: prioridad,
    value: pacientesPorPrioridad[prioridad],
    color: COLORS[index]
  }));

  // Calcular recursos disponibles vs ocupados
  const recursosDisponibles = recursos.filter(r => r.disponible).length;



  // Calcular tiempo promedio de espera (simulado por ahora)
  const tiempoPromedioEspera = pacientes.length > 0 
    ? Math.round(pacientes.reduce((acc, p) => {
        const tiempoEspera = (Date.now() - new Date(p.tiempo_llegada)) / (1000 * 60); // minutos
        return acc + tiempoEspera;
      }, 0) / pacientes.length)
    : 0;

  return (
    <div className="estadisticas-container">
      
      {/* Tarjetas de métricas clave */}
      <div className="metricas-grid">
        <div className="metrica-card">
          <h3>👥 Total Pacientes</h3>
          <p className="metrica-numero">{pacientes.length}</p>
        </div>
        
        <div className="metrica-card">
          <h3>⏱️ Tiempo Promedio</h3>
          <p className="metrica-numero">{tiempoPromedioEspera} min</p>
        </div>
        
        <div className="metrica-card">
          <h3>✅ Recursos Disponibles</h3>
          <p className="metrica-numero">{recursosDisponibles}/{recursos.length}</p>
        </div>
        
        <div className="metrica-card">
          <h3>🚨 Casos Críticos</h3>
          <p className="metrica-numero critico">
            {pacientes.filter(p => p.prioridad === 'critica').length}
          </p>
        </div>
      </div>

      {/* Gráficas */}
      <div className="graficas-grid">
        
        {/* Gráfica de pacientes por área */}
        {datosArea.length > 0 && (
          <div className="card-grafica">
            <h3>📊 Pacientes por Área</h3>
            <BarChart width={400} height={250} data={datosArea}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="cantidad" fill="#667eea" />
            </BarChart>
          </div>
        )}

        {/* Gráfica de pacientes por prioridad */}
        {datosPrioridad.length > 0 && (
          <div className="card-grafica">
            <h3>🎯 Distribución por Prioridad</h3>
            <PieChart width={400} height={250}>
              <Pie
                data={datosPrioridad}
                cx={200}
                cy={125}
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {datosPrioridad.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </div>
        )}

      </div>
    </div>
  );
}

export default Estadisticas;