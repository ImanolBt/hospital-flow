import React, { useState } from 'react';

function Prediccion({ pacientes, recursos }) {
  const [areaPredecir, setAreaPredecir] = useState('emergencia');
  const [prediccion, setPrediccion] = useState(null);

  // Algoritmo simple de predicción basado en datos históricos
  const predecirTiempoEspera = () => {
    // Filtrar pacientes por área
    const pacientesArea = pacientes.filter(p => p.area === areaPredecir);
    
    if (pacientesArea.length === 0) {
      setPrediccion({
        tiempoEstimado: 0,
        nivel: 'bajo',
        mensaje: 'No hay pacientes en esta área. Tiempo de espera mínimo.'
      });
      return;
    }

    // Calcular tiempo promedio basado en prioridad
    const tiempoBase = {
      'critica': 5,
      'alta': 15,
      'media': 30,
      'baja': 45
    };

    // Factores de ajuste
    const factorCarga = pacientesArea.length * 10; // +10 min por cada paciente
    const recursosDisponibles = recursos.filter(r => r.disponible).length;
    const factorRecursos = recursosDisponibles > 0 ? 1 : 2; // Duplica si no hay recursos

    // Calcular tiempo ponderado por prioridad
    let tiempoTotal = 0;
    pacientesArea.forEach(p => {
      tiempoTotal += tiempoBase[p.prioridad] || 30;
    });

    const tiempoPromedio = Math.round((tiempoTotal / pacientesArea.length) * factorRecursos);
    const tiempoEstimado = tiempoPromedio + factorCarga;

    // Determinar nivel de saturación
    let nivel = 'bajo';
    let mensaje = '';
    
    if (tiempoEstimado < 20) {
      nivel = 'bajo';
      mensaje = 'Flujo normal. Se recomienda mantener el ritmo actual.';
    } else if (tiempoEstimado < 40) {
      nivel = 'medio';
      mensaje = 'Carga moderada. Considere optimizar recursos.';
    } else if (tiempoEstimado < 60) {
      nivel = 'alto';
      mensaje = '⚠️ Alta demanda. Se recomienda activar personal adicional.';
    } else {
      nivel = 'critico';
      mensaje = '🚨 SATURACIÓN CRÍTICA. Activar protocolo de emergencia.';
    }

    setPrediccion({
      tiempoEstimado,
      nivel,
      mensaje,
      pacientesEnArea: pacientesArea.length,
      recursosLibres: recursosDisponibles
    });
  };

  // Recomendaciones inteligentes de asignación
  const generarRecomendaciones = () => {
    const recomendaciones = [];

    // Analizar distribución de pacientes
    const areas = ['emergencia', 'consulta', 'uci', 'cirugia'];
    const distribucion = areas.map(area => ({
      area,
      cantidad: pacientes.filter(p => p.area === area).length,
      criticos: pacientes.filter(p => p.area === area && p.prioridad === 'critica').length
    }));

    // Identificar área más saturada
    const areaSaturada = distribucion.reduce((max, current) => 
      current.cantidad > max.cantidad ? current : max
    );

    if (areaSaturada.cantidad > 5) {
      recomendaciones.push({
        tipo: 'alta',
        icono: '🚨',
        texto: `${areaSaturada.area} tiene ${areaSaturada.cantidad} pacientes. Reasignar personal.`
      });
    }

    // Verificar casos críticos
    const casosCriticos = pacientes.filter(p => p.prioridad === 'critica').length;
    if (casosCriticos > 0) {
      recomendaciones.push({
        tipo: 'critica',
        icono: '⚠️',
        texto: `${casosCriticos} caso(s) crítico(s) requieren atención inmediata.`
      });
    }

    // Verificar recursos
    const recursosDisponibles = recursos.filter(r => r.disponible).length;
    if (recursosDisponibles < 2 && pacientes.length > 3) {
      recomendaciones.push({
        tipo: 'media',
        icono: '🛏️',
        texto: 'Recursos limitados. Preparar para liberar camas/quirófanos.'
      });
    }

    // Recomendación positiva si todo está bien
    if (recomendaciones.length === 0) {
      recomendaciones.push({
        tipo: 'baja',
        icono: '✅',
        texto: 'Sistema operando en condiciones óptimas.'
      });
    }

    return recomendaciones;
  };

  const recomendaciones = generarRecomendaciones();

  return (
    <div className="prediccion-container">
      
      {/* Predictor de tiempo de espera */}
      <div className="card prediccion-card">
        <h2>🔮 Predicción de Tiempo de Espera</h2>
        
        <div className="prediccion-form">
          <label>Selecciona el área a analizar:</label>
          <select 
            value={areaPredecir} 
            onChange={(e) => setAreaPredecir(e.target.value)}
            className="prediccion-select"
          >
            <option value="emergencia">Emergencia</option>
            <option value="consulta">Consulta Externa</option>
            <option value="uci">UCI</option>
            <option value="cirugia">Cirugía</option>
          </select>
          
          <button onClick={predecirTiempoEspera} className="btn-predecir">
            Calcular Predicción
          </button>
        </div>

        {prediccion && (
          <div className={`resultado-prediccion nivel-${prediccion.nivel}`}>
            <div className="tiempo-estimado">
              <span className="label">Tiempo estimado de espera:</span>
              <span className="valor">{prediccion.tiempoEstimado} min</span>
            </div>
            
            <div className="detalles-prediccion">
              <p>📊 Pacientes en {areaPredecir}: {prediccion.pacientesEnArea}</p>
              <p>🛏️ Recursos disponibles: {prediccion.recursosLibres}</p>
            </div>
            
            <div className="mensaje-prediccion">
              {prediccion.mensaje}
            </div>
          </div>
        )}
      </div>

      {/* Recomendaciones inteligentes */}
      <div className="card recomendaciones-card">
        <h2>💡 Recomendaciones del Sistema</h2>
        
        <div className="lista-recomendaciones">
          {recomendaciones.map((rec, index) => (
            <div key={index} className={`recomendacion tipo-${rec.tipo}`}>
              <span className="icono">{rec.icono}</span>
              <span className="texto">{rec.texto}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Análisis de tendencias */}
      <div className="card tendencias-card">
        <h2>📈 Análisis de Tendencias</h2>
        
        <div className="tendencias-grid">
          <div className="tendencia-item">
            <h4>Tasa de ocupación</h4>
            <div className="barra-progreso">
              <div 
                className="progreso-fill"
                style={{
                  width: `${(pacientes.length / (pacientes.length + recursos.filter(r => r.disponible).length)) * 100}%`
                }}
              ></div>
            </div>
            <p>{Math.round((pacientes.length / (pacientes.length + recursos.filter(r => r.disponible).length)) * 100)}% ocupado</p>
          </div>

          <div className="tendencia-item">
            <h4>Eficiencia de recursos</h4>
            <div className="barra-progreso">
              <div 
                className="progreso-fill eficiencia"
                style={{
                  width: `${(recursos.filter(r => !r.disponible).length / recursos.length) * 100}%`
                }}
              ></div>
            </div>
            <p>{Math.round((recursos.filter(r => !r.disponible).length / recursos.length) * 100)}% en uso</p>
          </div>

          <div className="tendencia-item">
            <h4>Casos prioritarios</h4>
            <div className="barra-progreso">
              <div 
                className="progreso-fill urgente"
                style={{
                  width: `${(pacientes.filter(p => p.prioridad === 'critica' || p.prioridad === 'alta').length / Math.max(pacientes.length, 1)) * 100}%`
                }}
              ></div>
            </div>
            <p>{Math.round((pacientes.filter(p => p.prioridad === 'critica' || p.prioridad === 'alta').length / Math.max(pacientes.length, 1)) * 100)}% urgentes</p>
          </div>
        </div>
      </div>

    </div>
  );
}

export default Prediccion;