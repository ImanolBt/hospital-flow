import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';

function ProyeccionAvanzada({ pacientes, recursos }) {
  const [proyeccionData, setProyeccionData] = useState([]);
  const [escenario, setEscenario] = useState('normal');
  const [pacientesAdicionales, setPacientesAdicionales] = useState(0);

  useEffect(() => {
    generarProyeccion();
  }, [pacientes, recursos, escenario, pacientesAdicionales]);

  const generarProyeccion = () => {
    const ahora = new Date();
    const datos = [];

    // Estado actual
    const pacientesActuales = pacientes.length;
    const recursosDisponibles = recursos.filter(r => r.disponible).length;

    for (let i = 0; i <= 6; i++) {
      const hora = new Date(ahora.getTime() + i * 60 * 60 * 1000);
      
      // Factores que afectan la proyección
      let factorHora = 1;
      const horaDelDia = hora.getHours();
      
      // Horas pico (8am-12pm y 2pm-6pm)
      if ((horaDelDia >= 8 && horaDelDia <= 12) || (horaDelDia >= 14 && horaDelDia <= 18)) {
        factorHora = 1.5;
      } else if (horaDelDia >= 0 && horaDelDia <= 6) {
        factorHora = 0.5;
      }

      // Calcular llegadas esperadas
      let llegadasEsperadas = Math.round(2 * factorHora);
      
      if (escenario === 'optimista') {
        llegadasEsperadas = Math.round(llegadasEsperadas * 0.7);
      } else if (escenario === 'pesimista') {
        llegadasEsperadas = Math.round(llegadasEsperadas * 1.5);
      }

      // Agregar pacientes adicionales del simulador
      if (i === 1 && pacientesAdicionales > 0) {
        llegadasEsperadas += pacientesAdicionales;
      }

      // Calcular atenciones (depende de recursos)
      const tasaAtencion = recursosDisponibles > 0 ? Math.min(3, recursosDisponibles) : 1;

      // Proyectar pacientes
      let pacientesProyectados;
      if (i === 0) {
        pacientesProyectados = pacientesActuales;
      } else {
        const anterior = datos[i - 1].pacientes;
        pacientesProyectados = Math.max(0, anterior + llegadasEsperadas - tasaAtencion);
      }

      // Proyectar recursos ocupados
      const recursosOcupados = Math.min(recursos.length, pacientesProyectados);
      const recursosLibres = recursos.length - recursosOcupados;

      // Calcular nivel de saturación
      const saturacion = (recursosOcupados / recursos.length) * 100;

      datos.push({
        hora: hora.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }),
        pacientes: pacientesProyectados,
        recursos: recursosLibres,
        saturacion: Math.round(saturacion),
        critico: pacientesProyectados > recursos.length ? pacientesProyectados - recursos.length : 0
      });
    }

    setProyeccionData(datos);
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid rgba(99, 102, 241, 0.4)',
          borderRadius: '8px',
          padding: '12px',
          color: '#e2e8f0'
        }}>
          <p style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>{payload[0].payload.hora}</p>
          <p style={{ margin: '4px 0', color: '#6366f1' }}>
            Pacientes: {payload[0].value}
          </p>
          <p style={{ margin: '4px 0', color: '#10b981' }}>
            Recursos libres: {payload[1].value}
          </p>
          <p style={{ margin: '4px 0', color: '#f59e0b' }}>
            Saturación: {payload[0].payload.saturacion}%
          </p>
          {payload[0].payload.critico > 0 && (
            <p style={{ margin: '4px 0', color: '#ef4444', fontWeight: 'bold' }}>
              ⚠️ Sobrecarga: +{payload[0].payload.critico}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ 
      maxWidth: '1600px', 
      margin: '0 auto', 
      padding: '30px',
      position: 'relative',
      zIndex: 1
    }}>
      
      {/* Controles */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h2>📈 PROYECCIÓN PRÓXIMAS 6 HORAS</h2>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '16px',
          marginTop: '20px'
        }}>
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px',
              color: '#94a3b8',
              fontSize: '13px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Escenario de Proyección
            </label>
            <select 
              value={escenario}
              onChange={(e) => setEscenario(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                background: 'rgba(30, 41, 59, 0.5)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                borderRadius: '8px',
                color: '#e2e8f0',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              <option value="optimista">🟢 Optimista (baja demanda)</option>
              <option value="normal">🟡 Normal (demanda típica)</option>
              <option value="pesimista">🔴 Pesimista (alta demanda)</option>
            </select>
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px',
              color: '#94a3b8',
              fontSize: '13px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Simulador: Pacientes adicionales en 1h
            </label>
            <input
              type="number"
              min="0"
              max="20"
              value={pacientesAdicionales}
              onChange={(e) => setPacientesAdicionales(parseInt(e.target.value) || 0)}
              style={{
                width: '100%',
                padding: '12px',
                background: 'rgba(30, 41, 59, 0.5)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                borderRadius: '8px',
                color: '#e2e8f0',
                fontSize: '14px',
                fontWeight: '500'
              }}
              placeholder="Ej: 5"
            />
          </div>
        </div>
      </div>

      {/* Gráfica principal */}
      <div className="card">
        <h2>📊 GRÁFICA DE PROYECCIÓN</h2>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={proyeccionData}>
            <defs>
              <linearGradient id="colorPacientes" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorRecursos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(99, 102, 241, 0.1)" />
            <XAxis 
              dataKey="hora" 
              stroke="#94a3b8"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#94a3b8"
              style={{ fontSize: '12px' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{
                paddingTop: '20px',
                fontSize: '14px',
                fontWeight: '600'
              }}
            />
            <Area 
              type="monotone" 
              dataKey="pacientes" 
              stroke="#6366f1" 
              fillOpacity={1}
              fill="url(#colorPacientes)"
              strokeWidth={3}
              name="Pacientes Proyectados"
            />
            <Area 
              type="monotone" 
              dataKey="recursos" 
              stroke="#10b981" 
              fillOpacity={1}
              fill="url(#colorRecursos)"
              strokeWidth={3}
              name="Recursos Disponibles"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Análisis de proyección */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px',
        marginTop: '24px'
      }}>
        {proyeccionData.map((dato, index) => {
          if (index === 0) return null; // Saltar hora actual
          
          let nivel = 'normal';
          let mensaje = 'Flujo estable';
          
          if (dato.saturacion >= 90) {
            nivel = 'critico';
            mensaje = '🚨 SATURACIÓN CRÍTICA';
          } else if (dato.saturacion >= 70) {
            nivel = 'alto';
            mensaje = '⚠️ Alta ocupación';
          } else if (dato.saturacion >= 50) {
            nivel = 'medio';
            mensaje = '📊 Ocupación moderada';
          } else {
            nivel = 'bajo';
            mensaje = '✅ Capacidad disponible';
          }

          return (
            <div 
              key={index}
              className="card"
              style={{
                borderLeft: `4px solid ${
                  nivel === 'critico' ? '#ef4444' :
                  nivel === 'alto' ? '#f59e0b' :
                  nivel === 'medio' ? '#6366f1' :
                  '#10b981'
                }`
              }}
            >
              <h3 style={{
                margin: '0 0 12px 0',
                fontSize: '16px',
                color: '#94a3b8',
                fontFamily: 'JetBrains Mono, monospace'
              }}>
                {dato.hora} (+{index}h)
              </h3>
              <div style={{
                fontSize: '32px',
                fontWeight: '800',
                marginBottom: '8px',
                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                {dato.pacientes} pacientes
              </div>
              <div style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '12px' }}>
                {dato.recursos} recursos libres
              </div>
              <div style={{
                padding: '8px 12px',
                background: `${
                  nivel === 'critico' ? 'rgba(239, 68, 68, 0.1)' :
                  nivel === 'alto' ? 'rgba(245, 158, 11, 0.1)' :
                  nivel === 'medio' ? 'rgba(99, 102, 241, 0.1)' :
                  'rgba(16, 185, 129, 0.1)'
                }`,
                border: `1px solid ${
                  nivel === 'critico' ? 'rgba(239, 68, 68, 0.3)' :
                  nivel === 'alto' ? 'rgba(245, 158, 11, 0.3)' :
                  nivel === 'medio' ? 'rgba(99, 102, 241, 0.3)' :
                  'rgba(16, 185, 129, 0.3)'
                }`,
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '600',
                textAlign: 'center'
              }}>
                {mensaje}
              </div>
              {dato.critico > 0 && (
                <div style={{
                  marginTop: '12px',
                  padding: '8px 12px',
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '700',
                  color: '#fca5a5'
                }}>
                  Sobrecarga: +{dato.critico} pacientes sin recurso
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ProyeccionAvanzada;