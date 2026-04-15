import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#a855f7'];

function Estadisticas({ pacientes, recursos }) {
  
  // Contar pacientes por área
  const pacientesPorArea = pacientes.reduce((acc, p) => {
    acc[p.area] = (acc[p.area] || 0) + 1;
    return acc;
  }, {});

  const datosArea = Object.keys(pacientesPorArea).map(area => ({
    name: area.toUpperCase(),
    cantidad: pacientesPorArea[area]
  }));

  // Contar pacientes por prioridad
  const pacientesPorPrioridad = pacientes.reduce((acc, p) => {
    acc[p.prioridad] = (acc[p.prioridad] || 0) + 1;
    return acc;
  }, {});

  const datosPrioridad = Object.keys(pacientesPorPrioridad).map((prioridad, index) => ({
    name: prioridad.toUpperCase(),
    value: pacientesPorPrioridad[prioridad],
    color: COLORS[index]
  }));

  // Calcular recursos disponibles vs ocupados
  const recursosDisponibles = recursos.filter(r => r.disponible).length;
  const recursosOcupados = recursos.filter(r => !r.disponible).length;

  // Calcular tiempo promedio de espera (CORREGIDO)
  const tiempoPromedioEspera = pacientes.length > 0 
    ? Math.round(pacientes.reduce((acc, p) => {
        const tiempoEspera = (Date.now() - new Date(p.tiempo_llegada)) / (1000 * 60); // minutos
        return acc + tiempoEspera;
      }, 0) / pacientes.length)
    : 0;

  // Custom Tooltip para las gráficas
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid rgba(99, 102, 241, 0.4)',
          borderRadius: '8px',
          padding: '12px',
          color: '#e2e8f0',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
        }}>
          <p style={{ margin: '0', fontWeight: 'bold', marginBottom: '4px' }}>
            {payload[0].payload.name || payload[0].name}
          </p>
          <p style={{ margin: '0', color: '#6366f1' }}>
            Cantidad: {payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ 
      maxWidth: '1800px', 
      margin: '0 auto', 
      padding: '30px',
      position: 'relative',
      zIndex: 1
    }}>
      
      {/* MÉTRICAS PRINCIPALES EN GRID */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        
        {/* Total Pacientes */}
        <div className="card" style={{
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          textAlign: 'center'
        }}>
          <h3 style={{
            fontSize: '14px',
            color: '#94a3b8',
            margin: '0 0 16px 0',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            fontWeight: '600'
          }}>
            👥 Total Pacientes
          </h3>
          <p style={{
            fontSize: '64px',
            fontWeight: '900',
            margin: '0',
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontFamily: 'JetBrains Mono, monospace',
            lineHeight: '1'
          }}>
            {pacientes.length}
          </p>
        </div>

        {/* Tiempo Promedio CORREGIDO */}
        <div className="card" style={{
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(251, 191, 36, 0.1) 100%)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          textAlign: 'center'
        }}>
          <h3 style={{
            fontSize: '14px',
            color: '#94a3b8',
            margin: '0 0 16px 0',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            fontWeight: '600'
          }}>
            ⏱️ Tiempo Promedio
          </h3>
          <p style={{
            fontSize: '64px',
            fontWeight: '900',
            margin: '0',
            background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontFamily: 'JetBrains Mono, monospace',
            lineHeight: '1'
          }}>
            {tiempoPromedioEspera > 1440 ? Math.round(tiempoPromedioEspera / 60) : tiempoPromedioEspera}
          </p>
          <p style={{
            fontSize: '16px',
            color: '#94a3b8',
            margin: '8px 0 0 0',
            fontWeight: '600'
          }}>
            {tiempoPromedioEspera > 1440 ? 'horas' : 'minutos'}
          </p>
        </div>

        {/* Recursos Disponibles */}
        <div className="card" style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          textAlign: 'center'
        }}>
          <h3 style={{
            fontSize: '14px',
            color: '#94a3b8',
            margin: '0 0 16px 0',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            fontWeight: '600'
          }}>
            ✅ Recursos Disponibles
          </h3>
          <p style={{
            fontSize: '64px',
            fontWeight: '900',
            margin: '0',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontFamily: 'JetBrains Mono, monospace',
            lineHeight: '1'
          }}>
            {recursosDisponibles}
          </p>
          <p style={{
            fontSize: '16px',
            color: '#94a3b8',
            margin: '8px 0 0 0',
            fontWeight: '600'
          }}>
            de {recursos.length} totales
          </p>
        </div>

        {/* Casos Críticos */}
        <div className="card" style={{
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          textAlign: 'center'
        }}>
          <h3 style={{
            fontSize: '14px',
            color: '#94a3b8',
            margin: '0 0 16px 0',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            fontWeight: '600'
          }}>
            🚨 Casos Críticos
          </h3>
          <p style={{
            fontSize: '64px',
            fontWeight: '900',
            margin: '0',
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontFamily: 'JetBrains Mono, monospace',
            lineHeight: '1',
            animation: pacientes.filter(p => p.prioridad === 'critica').length > 0 ? 'pulse 2s infinite' : 'none'
          }}>
            {pacientes.filter(p => p.prioridad === 'critica').length}
          </p>
        </div>

      </div>

      {/* GRÁFICAS EN GRID 2 COLUMNAS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
        gap: '24px',
        marginBottom: '30px'
      }}>
        
        {/* Gráfica de Barras - Pacientes por Área */}
        {datosArea.length > 0 && (
          <div className="card">
            <h2 style={{
              fontSize: '18px',
              color: '#e2e8f0',
              marginBottom: '24px',
              paddingBottom: '12px',
              borderBottom: '2px solid rgba(99, 102, 241, 0.3)',
              fontFamily: 'JetBrains Mono, monospace',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              📊 Pacientes por Área
            </h2>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={datosArea}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99, 102, 241, 0.1)" />
                <XAxis 
                  dataKey="name" 
                  stroke="#94a3b8"
                  style={{ fontSize: '12px', fontWeight: '600' }}
                />
                <YAxis 
                  stroke="#94a3b8"
                  style={{ fontSize: '12px' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="cantidad" 
                  fill="url(#colorGradient)"
                  radius={[8, 8, 0, 0]}
                />
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.9}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.9}/>
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Gráfica de Pastel - Distribución por Prioridad */}
        {datosPrioridad.length > 0 && (
          <div className="card">
            <h2 style={{
              fontSize: '18px',
              color: '#e2e8f0',
              marginBottom: '24px',
              paddingBottom: '12px',
              borderBottom: '2px solid rgba(99, 102, 241, 0.3)',
              fontFamily: 'JetBrains Mono, monospace',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              🎯 Distribución por Prioridad
            </h2>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={datosPrioridad}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {datosPrioridad.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

      </div>

      {/* BARRAS DE PROGRESO - ANÁLISIS */}
      <div className="card">
        <h2 style={{
          fontSize: '18px',
          color: '#e2e8f0',
          marginBottom: '24px',
          paddingBottom: '12px',
          borderBottom: '2px solid rgba(99, 102, 241, 0.3)',
          fontFamily: 'JetBrains Mono, monospace',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          📈 Análisis de Capacidad
        </h2>
        
        <div style={{
          display: 'grid',
          gap: '24px'
        }}>
          
          {/* Tasa de Ocupación */}
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '12px'
            }}>
              <h4 style={{
                margin: 0,
                color: '#e2e8f0',
                fontSize: '15px',
                fontWeight: '700'
              }}>
                Tasa de Ocupación
              </h4>
              <span style={{
                color: '#94a3b8',
                fontSize: '15px',
                fontWeight: '700',
                fontFamily: 'JetBrains Mono, monospace'
              }}>
                {recursos.length > 0 ? Math.round((recursosOcupados / recursos.length) * 100) : 0}%
              </span>
            </div>
            <div style={{
              height: '40px',
              background: 'rgba(30, 41, 59, 0.5)',
              borderRadius: '20px',
              overflow: 'hidden',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.3)'
            }}>
              <div style={{
                height: '100%',
                width: `${recursos.length > 0 ? (recursosOcupados / recursos.length) * 100 : 0}%`,
                background: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)',
                transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 0 20px rgba(99, 102, 241, 0.6)',
                borderRadius: '20px'
              }}></div>
            </div>
          </div>

          {/* Eficiencia de Recursos */}
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '12px'
            }}>
              <h4 style={{
                margin: 0,
                color: '#e2e8f0',
                fontSize: '15px',
                fontWeight: '700'
              }}>
                Eficiencia de Recursos
              </h4>
              <span style={{
                color: '#94a3b8',
                fontSize: '15px',
                fontWeight: '700',
                fontFamily: 'JetBrains Mono, monospace'
              }}>
                {recursos.length > 0 ? Math.round((recursosOcupados / recursos.length) * 100) : 0}%
              </span>
            </div>
            <div style={{
              height: '40px',
              background: 'rgba(30, 41, 59, 0.5)',
              borderRadius: '20px',
              overflow: 'hidden',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.3)'
            }}>
              <div style={{
                height: '100%',
                width: `${recursos.length > 0 ? (recursosOcupados / recursos.length) * 100 : 0}%`,
                background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 0 20px rgba(16, 185, 129, 0.6)',
                borderRadius: '20px'
              }}></div>
            </div>
          </div>

          {/* Casos Prioritarios */}
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '12px'
            }}>
              <h4 style={{
                margin: 0,
                color: '#e2e8f0',
                fontSize: '15px',
                fontWeight: '700'
              }}>
                Casos Prioritarios (Alta + Crítica)
              </h4>
              <span style={{
                color: '#94a3b8',
                fontSize: '15px',
                fontWeight: '700',
                fontFamily: 'JetBrains Mono, monospace'
              }}>
                {pacientes.length > 0 ? Math.round((pacientes.filter(p => p.prioridad === 'critica' || p.prioridad === 'alta').length / pacientes.length) * 100) : 0}%
              </span>
            </div>
            <div style={{
              height: '40px',
              background: 'rgba(30, 41, 59, 0.5)',
              borderRadius: '20px',
              overflow: 'hidden',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.3)'
            }}>
              <div style={{
                height: '100%',
                width: `${pacientes.length > 0 ? (pacientes.filter(p => p.prioridad === 'critica' || p.prioridad === 'alta').length / pacientes.length) * 100 : 0}%`,
                background: 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)',
                transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 0 20px rgba(239, 68, 68, 0.6)',
                borderRadius: '20px'
              }}></div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}

export default Estadisticas;