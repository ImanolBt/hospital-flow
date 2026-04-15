import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Estadisticas from './Estadisticas';
import Prediccion from './Prediccion';
import ReportesPDF from './ReportesPDF';
import MLAvanzado from './MLAvanzado';
import ProyeccionAvanzada from './ProyeccionAvanzada';
import './App.css';

function App() {
  const [pacientes, setPacientes] = useState([]);
  const [recursos, setRecursos] = useState([]);
  const [nombre, setNombre] = useState('');
  const [edad, setEdad] = useState('');
  const [area, setArea] = useState('emergencia');
  const [prioridad, setPrioridad] = useState('media');
  const [vistaActual, setVistaActual] = useState('dashboard');
  const [alertaCritica, setAlertaCritica] = useState(null);
  const [tiempoActual, setTiempoActual] = useState(new Date());
  const [sonidoHabilitado, setSonidoHabilitado] = useState(true);

  // Actualizar reloj cada segundo
  useEffect(() => {
    const interval = setInterval(() => {
      setTiempoActual(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Cargar datos al inicio
  useEffect(() => {
    cargarPacientes();
    cargarRecursos();
    
    // Actualizar cada 5 segundos para tiempo real
    const interval = setInterval(() => {
      cargarPacientes();
      cargarRecursos();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Detectar casos críticos y mostrar alerta
  useEffect(() => {
    const criticos = pacientes.filter(p => p.prioridad === 'critica' && p.estado === 'esperando');
    if (criticos.length > 0) {
      setAlertaCritica({
        cantidad: criticos.length,
        mensaje: `${criticos.length} paciente(s) en estado CRÍTICO requieren atención INMEDIATA`
      });
      
      // Sonido de alerta
      if (sonidoHabilitado) {
        reproducirSonidoAlerta();
      }
    } else {
      setAlertaCritica(null);
    }
  }, [pacientes, sonidoHabilitado]);

  // Función para reproducir sonido de alerta
  const reproducirSonidoAlerta = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.log('Audio no disponible:', error);
    }
  };

  // Función para cargar pacientes
  const cargarPacientes = async () => {
    const { data, error } = await supabase
      .from('pacientes')
      .select(`
        *,
        recursos (
          id,
          nombre,
          tipo
        )
      `)
      .eq('estado', 'esperando')
      .order('tiempo_llegada', { ascending: false });
    
    if (error) {
      console.error('Error:', error);
    } else {
      setPacientes(data);
    }
  };

  // Función para cargar recursos
  const cargarRecursos = async () => {
    const { data, error } = await supabase
      .from('recursos')
      .select('*');
    
    if (error) {
      console.error('Error:', error);
    } else {
      setRecursos(data);
    }
  };

  // Función para agregar paciente
  const agregarPaciente = async (e) => {
    e.preventDefault();
    
    const { error } = await supabase
      .from('pacientes')
      .insert([
        { nombre, edad: parseInt(edad), area, prioridad, estado: 'esperando' }
      ]);

    if (error) {
      alert('Error al agregar paciente');
      console.error(error);
    } else {
      mostrarNotificacion('✅ Paciente registrado correctamente', 'success');
      setNombre('');
      setEdad('');
      
      // Asignación automática si es crítico
      if (prioridad === 'critica') {
        setTimeout(() => {
          asignarAutomaticamente();
        }, 1000);
      }
      
      cargarPacientes();
    }
  };

  // Función de asignación automática inteligente
  const asignarAutomaticamente = async () => {
    // Obtener pacientes sin asignar ordenados por prioridad
    const pacientesSinAsignar = pacientes.filter(p => !p.recurso_asignado_id);
    
    if (pacientesSinAsignar.length === 0) {
      mostrarNotificacion('ℹ️ No hay pacientes sin asignar', 'info');
      return;
    }

    // Ordenar por prioridad (crítica primero)
    const prioridadOrden = { 'critica': 0, 'alta': 1, 'media': 2, 'baja': 3 };
    pacientesSinAsignar.sort((a, b) => prioridadOrden[a.prioridad] - prioridadOrden[b.prioridad]);

    // Obtener recursos disponibles del área
    const recursosDisponibles = recursos.filter(r => r.disponible);

    if (recursosDisponibles.length === 0) {
      mostrarNotificacion('⚠️ No hay recursos disponibles. Pacientes en sala de espera.', 'warning');
      return;
    }

    let asignaciones = 0;

    for (let paciente of pacientesSinAsignar) {
      // Buscar recurso disponible del tipo apropiado según área
      let recursoIdeal = recursosDisponibles.find(r => {
        if (paciente.area === 'uci' && r.tipo === 'cama' && r.nombre.includes('UCI')) return true;
        if (paciente.area === 'emergencia' && r.tipo === 'cama' && r.nombre.includes('Emergencia')) return true;
        if (paciente.area === 'cirugia' && r.tipo === 'quirofano') return true;
        return false;
      });

      // Si no hay recurso ideal, tomar cualquiera disponible
      if (!recursoIdeal) {
        recursoIdeal = recursosDisponibles[0];
      }

      if (recursoIdeal) {
        // Asignar paciente a recurso
        const { error: errorPaciente } = await supabase
          .from('pacientes')
          .update({ recurso_asignado_id: recursoIdeal.id })
          .eq('id', paciente.id);

        // Marcar recurso como ocupado
        const { error: errorRecurso } = await supabase
          .from('recursos')
          .update({ disponible: false })
          .eq('id', recursoIdeal.id);

        // Registrar en historial
        await supabase
          .from('historial_asignaciones')
          .insert([{
            paciente_id: paciente.id,
            recurso_id: recursoIdeal.id,
            tipo_atencion: paciente.area
          }]);

        if (!errorPaciente && !errorRecurso) {
          asignaciones++;
          // Remover recurso de disponibles
          const index = recursosDisponibles.indexOf(recursoIdeal);
          recursosDisponibles.splice(index, 1);
        }
      }
    }

    if (asignaciones > 0) {
      mostrarNotificacion(`✅ ${asignaciones} paciente(s) asignado(s) automáticamente`, 'success');
      cargarPacientes();
      cargarRecursos();
    } else {
      mostrarNotificacion('⚠️ No hay recursos disponibles para asignar', 'warning');
    }
  };

  // Función para atender paciente (cambiar estado y liberar recurso)
  const atenderPaciente = async (paciente) => {
    // Cambiar estado del paciente
    const { error: errorPaciente } = await supabase
      .from('pacientes')
      .update({ estado: 'atendido' })
      .eq('id', paciente.id);

    // Si tenía recurso asignado, liberarlo
    if (paciente.recurso_asignado_id) {
      const { error: errorRecurso } = await supabase
        .from('recursos')
        .update({ disponible: true })
        .eq('id', paciente.recurso_asignado_id);

      // Actualizar historial
      await supabase
        .from('historial_asignaciones')
        .update({ tiempo_liberacion: new Date().toISOString() })
        .eq('paciente_id', paciente.id)
        .is('tiempo_liberacion', null);

      if (!errorRecurso) {
        mostrarNotificacion(`✅ ${paciente.nombre} atendido. Recurso liberado.`, 'success');
      }
    }

    if (errorPaciente) {
      console.error('Error:', errorPaciente);
    } else {
      cargarPacientes();
      cargarRecursos();
    }
  };

  // Sistema de notificaciones
  const mostrarNotificacion = (mensaje, tipo) => {
    const notif = document.createElement('div');
    notif.className = `notificacion notif-${tipo}`;
    notif.textContent = mensaje;
    notif.style.cssText = `
      position: fixed;
      top: 100px;
      right: 30px;
      padding: 16px 24px;
      background: ${tipo === 'success' ? 'rgba(16, 185, 129, 0.95)' : tipo === 'warning' ? 'rgba(245, 158, 11, 0.95)' : 'rgba(59, 130, 246, 0.95)'};
      color: white;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      z-index: 10000;
      animation: slideIn 0.3s ease-out;
      font-weight: 600;
      font-size: 14px;
    `;
    document.body.appendChild(notif);

    setTimeout(() => {
      notif.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => notif.remove(), 300);
    }, 3000);
  };

  // Calcular tiempo de espera en tiempo real
  const calcularTiempoEspera = (tiempoLlegada) => {
    const ahora = new Date();
    const llegada = new Date(tiempoLlegada);
    const diff = Math.floor((ahora - llegada) / 1000 / 60); // minutos
    return diff;
  };

  return (
    <div className="App">
      <header>
        <div className="header-top">
          <h1>🏥 HOSPITAL CONTROL CENTER</h1>
          <div className="system-status">
            <div className="status-indicator">
              <div className="status-dot"></div>
              <span>SISTEMA ACTIVO</span>
            </div>
            <div className="live-clock">
              {tiempoActual.toLocaleTimeString('es-EC', { 
                hour: '2-digit', 
                minute: '2-digit',
                second: '2-digit',
                hour12: false 
              })}
            </div>
          </div>
        </div>
        
        <div className="menu-botones">
          <button 
            className={vistaActual === 'dashboard' ? 'activo' : ''}
            onClick={() => setVistaActual('dashboard')}
          >
            📋 DASHBOARD
          </button>
          <button 
            className={vistaActual === 'estadisticas' ? 'activo' : ''}
            onClick={() => setVistaActual('estadisticas')}
          >
            📊 ESTADÍSTICAS
          </button>
          <button 
            className={vistaActual === 'proyeccion' ? 'activo' : ''}
            onClick={() => setVistaActual('proyeccion')}
          >
            📈 PROYECCIÓN 6H
          </button>
          <button 
            className={vistaActual === 'prediccion' ? 'activo' : ''}
            onClick={() => setVistaActual('prediccion')}
          >
            🤖 PREDICCIÓN IA
          </button>
          <button 
            className={vistaActual === 'reportes' ? 'activo' : ''}
            onClick={() => setVistaActual('reportes')}
          >
            📄 REPORTES PDF
          </button>
          <button 
            className={vistaActual === 'ml' ? 'activo' : ''}
            onClick={() => setVistaActual('ml')}
          >
            🧠 ML AVANZADO
          </button>
        </div>
      </header>

      {/* ALERTA CRÍTICA */}
      {alertaCritica && (
        <div className="alerta-critica">
          <h3>🚨 ALERTA CRÍTICA</h3>
          <p>{alertaCritica.mensaje}</p>
          <button onClick={() => {
            setAlertaCritica(null);
            setSonidoHabilitado(false);
          }}>
            Silenciar
          </button>
        </div>
      )}

      {vistaActual === 'dashboard' ? (
        <div className="container">
          {/* Formulario para agregar paciente */}
          <div className="card">
            <h2>➕ REGISTRAR PACIENTE</h2>
            <form onSubmit={agregarPaciente}>
              <input
                type="text"
                placeholder="Nombre completo del paciente"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
              />
              
              <input
                type="number"
                placeholder="Edad"
                value={edad}
                onChange={(e) => setEdad(e.target.value)}
                required
              />
              
              <select value={area} onChange={(e) => setArea(e.target.value)}>
                <option value="emergencia">🚨 Emergencia</option>
                <option value="consulta">📋 Consulta Externa</option>
                <option value="uci">🏥 UCI</option>
                <option value="cirugia">⚕️ Cirugía</option>
              </select>
              
              <select value={prioridad} onChange={(e) => setPrioridad(e.target.value)}>
                <option value="baja">🟢 Baja</option>
                <option value="media">🟡 Media</option>
                <option value="alta">🟠 Alta</option>
                <option value="critica">🔴 Crítica</option>
              </select>
              
              <button type="submit">REGISTRAR PACIENTE</button>
            </form>
            
            <button 
              onClick={asignarAutomaticamente}
              style={{
                marginTop: '16px',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)'
              }}
            >
              🤖 ASIGNAR AUTOMÁTICAMENTE
            </button>
          </div>

          {/* Lista de pacientes */}
          <div className="card">
            <h2>👥 PACIENTES EN ESPERA ({pacientes.length})</h2>
            <div className="lista-pacientes">
              {pacientes.map((paciente) => (
                <div key={paciente.id} className={`paciente prioridad-${paciente.prioridad}`}>
                  <div className="paciente-info">
                    <strong>{paciente.nombre}</strong>
                    <small>
                      {paciente.edad} años | Área: {paciente.area} | Prioridad: {paciente.prioridad}
                      <br />
                      Llegada: {new Date(paciente.tiempo_llegada).toLocaleString('es-EC')}
                      <div className="contador-tiempo-real">
                        ⏱️ Esperando: {calcularTiempoEspera(paciente.tiempo_llegada)} min
                      </div>
                      {paciente.recursos && (
                        <div className="asignacion-info">
                          ✅ Asignado: {paciente.recursos.nombre}
                        </div>
                      )}
                      {!paciente.recursos && (
                        <div style={{
                          display: 'inline-block',
                          marginTop: '10px',
                          padding: '6px 12px',
                          background: 'rgba(245, 158, 11, 0.2)',
                          border: '1px solid rgba(245, 158, 11, 0.4)',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: '700',
                          color: '#fbbf24',
                          textTransform: 'uppercase'
                        }}>
                          ⏳ SALA DE ESPERA
                        </div>
                      )}
                    </small>
                  </div>
                  <button 
                    className="btn-atender"
                    onClick={() => atenderPaciente(paciente)}
                  >
                    ✓ ATENDER
                  </button>
                </div>
              ))}
              {pacientes.length === 0 && (
                <p style={{textAlign: 'center', color: '#64748b', padding: '40px'}}>
                  No hay pacientes en espera
                </p>
              )}
            </div>
          </div>

          {/* Recursos disponibles */}
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <h2>🛏️ ESTADO DE RECURSOS EN TIEMPO REAL</h2>
            
            {/* Resumen rápido */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              marginBottom: '24px',
              padding: '20px',
              background: 'rgba(99, 102, 241, 0.05)',
              borderRadius: '12px',
              border: '1px solid rgba(99, 102, 241, 0.2)'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>
                  Total Recursos
                </div>
                <div style={{ fontSize: '36px', fontWeight: '800', color: '#e2e8f0', fontFamily: 'JetBrains Mono, monospace' }}>
                  {recursos.length}
                </div>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>
                  ✅ Disponibles
                </div>
                <div style={{ fontSize: '36px', fontWeight: '800', color: '#10b981', fontFamily: 'JetBrains Mono, monospace' }}>
                  {recursos.filter(r => r.disponible).length}
                </div>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>
                  🔴 Ocupados
                </div>
                <div style={{ fontSize: '36px', fontWeight: '800', color: '#ef4444', fontFamily: 'JetBrains Mono, monospace' }}>
                  {recursos.filter(r => !r.disponible).length}
                </div>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>
                  % Ocupación
                </div>
                <div style={{ fontSize: '36px', fontWeight: '800', color: recursos.length > 0 && recursos.filter(r => !r.disponible).length / recursos.length > 0.8 ? '#ef4444' : '#f59e0b', fontFamily: 'JetBrains Mono, monospace' }}>
                  {recursos.length > 0 ? Math.round((recursos.filter(r => !r.disponible).length / recursos.length) * 100) : 0}%
                </div>
              </div>
            </div>

            {/* Alertas de recursos */}
            {recursos.filter(r => r.disponible).length === 0 && (
              <div style={{
                padding: '20px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '2px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '12px',
                marginBottom: '20px',
                animation: 'pulse 2s infinite'
              }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#ef4444', fontSize: '18px', fontWeight: '800' }}>
                  🚨 ALERTA: SIN RECURSOS DISPONIBLES
                </h3>
                <p style={{ margin: '0', color: '#fca5a5', fontSize: '14px' }}>
                  ⚠️ Todos los recursos están ocupados. Pacientes nuevos entrarán en sala de espera.
                </p>
              </div>
            )}

            {recursos.filter(r => r.disponible).length > 0 && recursos.filter(r => r.disponible).length <= 2 && (
              <div style={{
                padding: '20px',
                background: 'rgba(245, 158, 11, 0.1)',
                border: '2px solid rgba(245, 158, 11, 0.4)',
                borderRadius: '12px',
                marginBottom: '20px'
              }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#f59e0b', fontSize: '16px', fontWeight: '700' }}>
                  ⚠️ ADVERTENCIA: Recursos limitados
                </h3>
                <p style={{ margin: '0', color: '#fbbf24', fontSize: '14px' }}>
                  Solo quedan {recursos.filter(r => r.disponible).length} recurso(s) disponible(s). Considera preparar recursos adicionales.
                </p>
              </div>
            )}

            {/* Grid de recursos */}
            <div className="recursos">
              {recursos.map((recurso) => {
                // Buscar paciente asignado a este recurso
                const pacienteAsignado = pacientes.find(p => p.recurso_asignado_id === recurso.id);
                
                return (
                  <div 
                    key={recurso.id} 
                    className={`recurso ${recurso.disponible ? 'disponible' : 'ocupado'}`}
                    style={{
                      position: 'relative',
                      minHeight: '140px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <strong>{recurso.nombre}</strong>
                      <small>{recurso.tipo}</small>
                    </div>
                    
                    <div>
                      {recurso.disponible ? (
                        <span className="estado" style={{
                          background: 'rgba(16, 185, 129, 0.2)',
                          color: '#10b981',
                          border: '1px solid rgba(16, 185, 129, 0.4)'
                        }}>
                          ✅ DISPONIBLE
                        </span>
                      ) : (
                        <>
                          <span className="estado" style={{
                            background: 'rgba(239, 68, 68, 0.2)',
                            color: '#ef4444',
                            border: '1px solid rgba(239, 68, 68, 0.4)',
                            marginBottom: '8px',
                            display: 'block'
                          }}>
                            🔴 OCUPADO
                          </span>
                          {pacienteAsignado && (
                            <div style={{
                              fontSize: '11px',
                              color: '#94a3b8',
                              marginTop: '8px',
                              padding: '6px 8px',
                              background: 'rgba(15, 23, 42, 0.6)',
                              borderRadius: '6px',
                              border: '1px solid rgba(99, 102, 241, 0.2)'
                            }}>
                              <strong style={{ color: '#e2e8f0', display: 'block', marginBottom: '4px' }}>
                                {pacienteAsignado.nombre}
                              </strong>
                              <div style={{ fontSize: '10px' }}>
                                Prioridad: {pacienteAsignado.prioridad}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Sistema de recomendaciones inteligentes */}
            <div style={{ marginTop: '24px' }}>
              <h3 style={{
                fontSize: '16px',
                color: '#e2e8f0',
                marginBottom: '16px',
                paddingBottom: '12px',
                borderBottom: '2px solid rgba(99, 102, 241, 0.3)',
                fontFamily: 'JetBrains Mono, monospace',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                💡 RECOMENDACIONES DEL SISTEMA
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Sin recursos */}
                {recursos.filter(r => r.disponible).length === 0 && (
                  <div style={{
                    padding: '16px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '10px',
                    borderLeft: '4px solid #ef4444'
                  }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#fca5a5', marginBottom: '6px' }}>
                      🚨 ACCIÓN URGENTE REQUERIDA
                    </div>
                    <div style={{ fontSize: '13px', color: '#fecaca', lineHeight: '1.6' }}>
                      • Contactar a equipo de alta para liberar camas<br/>
                      • Activar protocolo de liberación rápida<br/>
                      • Considerar traslados a otras áreas<br/>
                      • Notificar a dirección médica
                    </div>
                  </div>
                )}

                {/* Recursos bajos */}
                {recursos.filter(r => r.disponible).length > 0 && recursos.filter(r => r.disponible).length <= 2 && (
                  <div style={{
                    padding: '16px',
                    background: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    borderRadius: '10px',
                    borderLeft: '4px solid #f59e0b'
                  }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#fbbf24', marginBottom: '6px' }}>
                      ⚠️ PREPARAR RECURSOS ADICIONALES
                    </div>
                    <div style={{ fontSize: '13px', color: '#fde68a', lineHeight: '1.6' }}>
                      • Alertar a personal de limpieza para preparación rápida<br/>
                      • Revisar lista de pacientes próximos a alta<br/>
                      • Contactar con áreas menos saturadas
                    </div>
                  </div>
                )}

                {/* Pacientes sin asignar */}
                {pacientes.filter(p => !p.recurso_asignado_id).length > 0 && (
                  <div style={{
                    padding: '16px',
                    background: 'rgba(99, 102, 241, 0.1)',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    borderRadius: '10px',
                    borderLeft: '4px solid #6366f1'
                  }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#a5b4fc', marginBottom: '6px' }}>
                      📋 PACIENTES EN SALA DE ESPERA
                    </div>
                    <div style={{ fontSize: '13px', color: '#c7d2fe', lineHeight: '1.6' }}>
                      {pacientes.filter(p => !p.recurso_asignado_id).length} paciente(s) esperando asignación de recurso<br/>
                      {pacientes.filter(p => !p.recurso_asignado_id && p.prioridad === 'critica').length > 0 && (
                        <span style={{ color: '#ef4444', fontWeight: '700' }}>
                          • ¡{pacientes.filter(p => !p.recurso_asignado_id && p.prioridad === 'critica').length} CRÍTICO(S) en espera!
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Todo bien */}
                {recursos.filter(r => r.disponible).length > 2 && pacientes.filter(p => !p.recurso_asignado_id).length === 0 && (
                  <div style={{
                    padding: '16px',
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '10px',
                    borderLeft: '4px solid #10b981'
                  }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#6ee7b7', marginBottom: '6px' }}>
                      ✅ SISTEMA OPERANDO ÓPTIMAMENTE
                    </div>
                    <div style={{ fontSize: '13px', color: '#a7f3d0', lineHeight: '1.6' }}>
                      Capacidad suficiente. Mantener monitoreo continuo.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : vistaActual === 'estadisticas' ? (
        <Estadisticas pacientes={pacientes} recursos={recursos} />
      ) : vistaActual === 'proyeccion' ? (
        <ProyeccionAvanzada pacientes={pacientes} recursos={recursos} />
      ) : vistaActual === 'prediccion' ? (
        <Prediccion pacientes={pacientes} recursos={recursos} />
      ) : vistaActual === 'reportes' ? (
        <ReportesPDF pacientes={pacientes} recursos={recursos} />
      ) : (
        <MLAvanzado pacientes={pacientes} recursos={recursos} />
      )}
    </div>
  );
}

export default App;