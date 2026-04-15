import React, { useState, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';

function MLAvanzado({ pacientes, recursos }) {
  const [modelo, setModelo] = useState(null);
  const [entrenando, setEntrenando] = useState(false);
  const [prediccionAvanzada, setPrediccionAvanzada] = useState(null);
  const [historialEntrenamiento, setHistorialEntrenamiento] = useState([]);

  // Crear y entrenar modelo de red neuronal
  const crearYEntrenarModelo = async () => {
    setEntrenando(true);
    
    try {
      // Crear modelo secuencial
      const nuevoModelo = tf.sequential();
      
      // Capa de entrada (5 características)
      nuevoModelo.add(tf.layers.dense({
        units: 16,
        activation: 'relu',
        inputShape: [5]
      }));
      
      // Capa oculta
      nuevoModelo.add(tf.layers.dense({
        units: 8,
        activation: 'relu'
      }));
      
      // Capa de salida (predice tiempo de espera)
      nuevoModelo.add(tf.layers.dense({
        units: 1,
        activation: 'linear'
      }));
      
      // Compilar modelo
      nuevoModelo.compile({
        optimizer: tf.train.adam(0.01),
        loss: 'meanSquaredError',
        metrics: ['mae']
      });

      // Generar datos de entrenamiento sintéticos
      const datosEntrenamiento = generarDatosEntrenamiento(200);
      
      const xs = tf.tensor2d(datosEntrenamiento.entradas);
      const ys = tf.tensor2d(datosEntrenamiento.salidas);

      // Entrenar el modelo
      const historia = await nuevoModelo.fit(xs, ys, {
        epochs: 50,
        batchSize: 32,
        validationSplit: 0.2,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            if (epoch % 10 === 0) {
              setHistorialEntrenamiento(prev => [...prev, {
                epoch: epoch + 1,
                loss: logs.loss.toFixed(4),
                val_loss: logs.val_loss ? logs.val_loss.toFixed(4) : 'N/A'
              }]);
            }
          }
        }
      });

      setModelo(nuevoModelo);
      setEntrenando(false);
      alert('✅ Modelo entrenado exitosamente con ' + historia.history.loss.length + ' épocas');
      
      // Limpiar tensores
      xs.dispose();
      ys.dispose();
      
    } catch (error) {
      console.error('Error entrenando modelo:', error);
      setEntrenando(false);
      alert('❌ Error al entrenar el modelo');
    }
  };

  // Generar datos sintéticos de entrenamiento
  const generarDatosEntrenamiento = (numMuestras) => {
    const entradas = [];
    const salidas = [];
    
    for (let i = 0; i < numMuestras; i++) {
      const numPacientes = Math.floor(Math.random() * 20);
      const prioridad = Math.random(); // 0-1 (0=baja, 1=crítica)
      const recursosDisp = Math.floor(Math.random() * 10);
      const hora = Math.floor(Math.random() * 24);
      const area = Math.floor(Math.random() * 4); // 0-3 (emergencia, consulta, uci, cirugía)
      
      // Características de entrada [numPacientes, prioridad, recursosDisp, hora, area]
      entradas.push([
        numPacientes / 20, // normalizar
        prioridad,
        recursosDisp / 10, // normalizar
        hora / 24, // normalizar
        area / 4 // normalizar
      ]);
      
      // Calcular tiempo de espera basado en factores (simulado)
      let tiempoEspera = 10; // tiempo base
      tiempoEspera += numPacientes * 5; // +5 min por paciente
      tiempoEspera += (1 - prioridad) * 30; // más tiempo si prioridad baja
      tiempoEspera += (10 - recursosDisp) * 3; // más tiempo si menos recursos
      if (hora >= 8 && hora <= 18) tiempoEspera += 10; // horas pico
      tiempoEspera += area * 5; // varía por área
      
      // Normalizar salida
      salidas.push([tiempoEspera / 100]);
    }
    
    return { entradas, salidas };
  };

  // Hacer predicción con el modelo
  const hacerPrediccionAvanzada = async () => {
    if (!modelo) {
      alert('⚠️ Primero debes entrenar el modelo');
      return;
    }

    const numPacientes = pacientes.length;
    const recursosDisp = recursos.filter(r => r.disponible).length;
    const horaActual = new Date().getHours();
    
    // Calcular prioridad promedio
    const prioridadMap = { baja: 0.25, media: 0.5, alta: 0.75, critica: 1.0 };
    const prioridadPromedio = pacientes.length > 0
      ? pacientes.reduce((sum, p) => sum + prioridadMap[p.prioridad], 0) / pacientes.length
      : 0.5;

    // Calcular área más saturada
    const areas = ['emergencia', 'consulta', 'uci', 'cirugia'];
    const distribucion = areas.map(area => 
      pacientes.filter(p => p.area === area).length
    );
    const areaMasSaturada = distribucion.indexOf(Math.max(...distribucion));

    // Preparar entrada para el modelo
    const entrada = tf.tensor2d([[
      numPacientes / 20,
      prioridadPromedio,
      recursosDisp / 10,
      horaActual / 24,
      areaMasSaturada / 4
    ]]);

    // Hacer predicción
    const prediccion = modelo.predict(entrada);
    const tiempoPredicho = (await prediccion.data())[0] * 100; // desnormalizar

    // Análisis adicional
    const analisis = analizarSistema(numPacientes, recursosDisp, prioridadPromedio, tiempoPredicho);

    setPrediccionAvanzada({
      tiempoEsperado: Math.round(tiempoPredicho),
      confianza: calcularConfianza(numPacientes, recursosDisp),
      factorCritico: analisis.factorCritico,
      recomendacionIA: analisis.recomendacion,
      tendencia: analisis.tendencia,
      metricasDetalladas: {
        numPacientes,
        recursosDisp,
        prioridadPromedio: (prioridadPromedio * 100).toFixed(1),
        horaActual,
        areaCritica: areas[areaMasSaturada]
      }
    });

    // Limpiar tensores
    entrada.dispose();
    prediccion.dispose();
  };

  // Calcular nivel de confianza de la predicción
  const calcularConfianza = (numPacientes, recursosDisp) => {
    let confianza = 85; // base
    
    if (numPacientes < 3) confianza -= 15; // poca data
    if (numPacientes > 15) confianza -= 10; // mucha variabilidad
    if (recursosDisp === 0) confianza -= 20; // situación extrema
    
    return Math.max(50, Math.min(95, confianza));
  };

  // Análisis inteligente del sistema
  const analizarSistema = (numPacientes, recursosDisp, prioridadPromedio, tiempoPredicho) => {
    let factorCritico = 'Normal';
    let recomendacion = '';
    let tendencia = 'estable';

    if (tiempoPredicho > 60) {
      factorCritico = 'Crítico';
      tendencia = 'empeorando';
      recomendacion = '🚨 ALERTA: Se proyecta saturación severa. Activar protocolo de emergencia y reasignar personal urgentemente.';
    } else if (tiempoPredicho > 40) {
      factorCritico = 'Alto';
      tendencia = 'aumentando';
      recomendacion = '⚠️ ADVERTENCIA: Sistema bajo presión. Considere llamar personal adicional y preparar recursos de respaldo.';
    } else if (tiempoPredicho > 25) {
      factorCritico = 'Moderado';
      tendencia = 'estable';
      recomendacion = '📊 MONITOREO: Flujo moderado. Mantenga vigilancia sobre casos prioritarios.';
    } else {
      factorCritico = 'Bajo';
      tendencia = 'mejorando';
      recomendacion = '✅ ÓPTIMO: Sistema operando eficientemente. Continuar con operaciones normales.';
    }

    if (recursosDisp === 0) {
      recomendacion = '🛏️ URGENTE: Sin recursos disponibles. Priorizar liberación de camas/quirófanos inmediatamente.';
    }

    if (prioridadPromedio > 0.7) {
      recomendacion += ' Atención: Alta concentración de casos prioritarios.';
    }

    return { factorCritico, recomendacion, tendencia };
  };

  return (
    <div className="ml-container">
      
      {/* Entrenamiento del modelo */}
      <div className="card">
        <h2>🤖 Red Neuronal de Predicción</h2>
        <p style={{marginBottom: '20px', color: '#666'}}>
          Utiliza TensorFlow.js para entrenar una red neuronal que predice tiempos de espera 
          basándose en múltiples variables del sistema.
        </p>

        <div className="ml-botones">
          <button 
            onClick={crearYEntrenarModelo}
            disabled={entrenando}
            className="btn-ml entrenar"
          >
            {entrenando ? '⏳ Entrenando...' : '🎓 Entrenar Modelo'}
          </button>

          <button 
            onClick={hacerPrediccionAvanzada}
            disabled={!modelo || entrenando}
            className="btn-ml predecir"
          >
            🔮 Hacer Predicción IA
          </button>
        </div>

        {entrenando && (
          <div className="entrenando-info">
            <p>⚙️ Entrenando red neuronal con 50 épocas...</p>
            <p>📊 Procesando 200 muestras sintéticas...</p>
          </div>
        )}

        {historialEntrenamiento.length > 0 && (
          <div className="historial-entrenamiento">
            <h4>📈 Progreso del Entrenamiento</h4>
            <table>
              <thead>
                <tr>
                  <th>Época</th>
                  <th>Loss</th>
                  <th>Val Loss</th>
                </tr>
              </thead>
              <tbody>
                {historialEntrenamiento.slice(-5).map((h, i) => (
                  <tr key={i}>
                    <td>{h.epoch}</td>
                    <td>{h.loss}</td>
                    <td>{h.val_loss}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Resultados de predicción */}
      {prediccionAvanzada && (
        <div className="card prediccion-ia-resultado">
          <h2>🎯 Predicción de Inteligencia Artificial</h2>
          
          <div className={`tiempo-ia nivel-${prediccionAvanzada.factorCritico.toLowerCase()}`}>
            <div className="tiempo-principal">
              <span className="label">Tiempo Esperado (IA):</span>
              <span className="valor">{prediccionAvanzada.tiempoEsperado} min</span>
            </div>
            <div className="confianza">
              Confianza: {prediccionAvanzada.confianza}%
            </div>
          </div>

          <div className="metricas-ia">
            <div className="metrica">
              <span className="icono">📊</span>
              <div>
                <strong>Factor Crítico</strong>
                <p className={`factor-${prediccionAvanzada.factorCritico.toLowerCase()}`}>
                  {prediccionAvanzada.factorCritico}
                </p>
              </div>
            </div>

            <div className="metrica">
              <span className="icono">📈</span>
              <div>
                <strong>Tendencia</strong>
                <p>{prediccionAvanzada.tendencia}</p>
              </div>
            </div>
          </div>

          <div className="recomendacion-ia">
            <h4>💡 Recomendación del Sistema IA</h4>
            <p>{prediccionAvanzada.recomendacionIA}</p>
          </div>

          <div className="detalles-ia">
            <h4>🔍 Análisis Detallado</h4>
            <ul>
              <li>Pacientes en sistema: {prediccionAvanzada.metricasDetalladas.numPacientes}</li>
              <li>Recursos disponibles: {prediccionAvanzada.metricasDetalladas.recursosDisp}</li>
              <li>Prioridad promedio: {prediccionAvanzada.metricasDetalladas.prioridadPromedio}%</li>
              <li>Hora actual: {prediccionAvanzada.metricasDetalladas.horaActual}:00</li>
              <li>Área crítica: {prediccionAvanzada.metricasDetalladas.areaCritica}</li>
            </ul>
          </div>
        </div>
      )}

      {/* Información del modelo */}
      <div className="card info-ml">
        <h3>ℹ️ Sobre la Red Neuronal</h3>
        <ul>
          <li><strong>Arquitectura:</strong> Red neuronal densa con 2 capas ocultas (16 y 8 neuronas)</li>
          <li><strong>Entrada:</strong> 5 características (pacientes, prioridad, recursos, hora, área)</li>
          <li><strong>Salida:</strong> Predicción de tiempo de espera en minutos</li>
          <li><strong>Entrenamiento:</strong> 50 épocas con 200 muestras sintéticas</li>
          <li><strong>Optimizador:</strong> Adam con tasa de aprendizaje 0.01</li>
          <li><strong>Función de pérdida:</strong> Error cuadrático medio (MSE)</li>
        </ul>
      </div>

    </div>
  );
}

export default MLAvanzado;