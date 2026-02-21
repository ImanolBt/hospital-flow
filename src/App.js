import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Estadisticas from './Estadisticas';
import Prediccion from './Prediccion';
import './App.css';

function App() {
  const [pacientes, setPacientes] = useState([]);
  const [recursos, setRecursos] = useState([]);
  const [nombre, setNombre] = useState('');
  const [edad, setEdad] = useState('');
  const [area, setArea] = useState('emergencia');
  const [prioridad, setPrioridad] = useState('media');
  const [vistaActual, setVistaActual] = useState('dashboard'); // dashboard o estadisticas

  // Cargar datos al inicio
  useEffect(() => {
    cargarPacientes();
    cargarRecursos();
    
    // Actualizar cada 10 segundos
    const interval = setInterval(() => {
      cargarPacientes();
      cargarRecursos();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Función para cargar pacientes
  const cargarPacientes = async () => {
    const { data, error } = await supabase
      .from('pacientes')
      .select('*')
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
    
    const { data, error } = await supabase
      .from('pacientes')
      .insert([
        { nombre, edad: parseInt(edad), area, prioridad, estado: 'esperando' }
      ]);

    if (error) {
      alert('Error al agregar paciente');
      console.error(error);
    } else {
      alert('Paciente agregado correctamente');
      setNombre('');
      setEdad('');
      cargarPacientes();
    }
  };

  // Función para atender paciente (cambiar estado)
  const atenderPaciente = async (id) => {
    const { error } = await supabase
      .from('pacientes')
      .update({ estado: 'atendido' })
      .eq('id', id);

    if (error) {
      console.error('Error:', error);
    } else {
      cargarPacientes();
    }
  };

  return (
    <div className="App">
      <header>
        <h1>🏥 Sistema de Optimización Hospitalaria</h1>
        <div className="menu-botones">
          <button 
            className={vistaActual === 'dashboard' ? 'activo' : ''}
            onClick={() => setVistaActual('dashboard')}
          >
            📋 Dashboard
          </button>
          <button 
  className={vistaActual === 'prediccion' ? 'activo' : ''}
  onClick={() => setVistaActual('prediccion')}
>
  🤖 Predicción IA
</button>
        </div>
      </header>

      {vistaActual === 'dashboard' ? (
        <div className="container">
          {/* Formulario para agregar paciente */}
          <div className="card">
            <h2>➕ Registrar Nuevo Paciente</h2>
            <form onSubmit={agregarPaciente}>
              <input
                type="text"
                placeholder="Nombre del paciente"
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
                <option value="emergencia">Emergencia</option>
                <option value="consulta">Consulta Externa</option>
                <option value="uci">UCI</option>
                <option value="cirugia">Cirugía</option>
              </select>
              
              <select value={prioridad} onChange={(e) => setPrioridad(e.target.value)}>
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
                <option value="critica">Crítica</option>
              </select>
              
              <button type="submit">Registrar Paciente</button>
            </form>
          </div>

          {/* Lista de pacientes */}
          <div className="card">
            <h2>👥 Pacientes en Espera ({pacientes.length})</h2>
            <div className="lista-pacientes">
              {pacientes.map((paciente) => (
                <div key={paciente.id} className={`paciente prioridad-${paciente.prioridad}`}>
                  <div className="paciente-info">
                    <strong>{paciente.nombre}</strong> - {paciente.edad} años
                    <br />
                    <small>
                      Área: {paciente.area} | Prioridad: {paciente.prioridad}
                      <br />
                      Llegada: {new Date(paciente.tiempo_llegada).toLocaleString()}
                    </small>
                  </div>
                  <button 
                    className="btn-atender"
                    onClick={() => atenderPaciente(paciente.id)}
                  >
                    ✓ Atender
                  </button>
                </div>
              ))}
              {pacientes.length === 0 && (
                <p style={{textAlign: 'center', color: '#999'}}>No hay pacientes en espera</p>
              )}
            </div>
          </div>

          {/* Recursos disponibles */}
          <div className="card">
            <h2>🛏️ Recursos Disponibles</h2>
            <div className="recursos">
              {recursos.map((recurso) => (
                <div key={recurso.id} className={`recurso ${recurso.disponible ? 'disponible' : 'ocupado'}`}>
                  <strong>{recurso.nombre}</strong>
                  <br />
                  <small>Tipo: {recurso.tipo}</small>
                  <br />
                  <span className="estado">
                    {recurso.disponible ? '✅ Disponible' : '❌ Ocupado'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
     ) : vistaActual === 'estadisticas' ? (
  <Estadisticas pacientes={pacientes} recursos={recursos} />
) : (
  <Prediccion pacientes={pacientes} recursos={recursos} />
)}
    </div>
  );
}

export default App;