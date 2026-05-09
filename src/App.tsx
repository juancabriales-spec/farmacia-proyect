import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { supabase } from './utils/supabaseClient'
import './App.css'

type Medicamento = {
  id: number
  nombre: string
  descripcion: string | null
  precio: number
  stock: number
  tipo: string
}

const tipos = [
  'Analgésico',
  'Antibiótico',
  'Antiinflamatorio',
  'Antipirético',
  'Vitaminas',
]

function App() {
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([])

  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [precio, setPrecio] = useState('')
  const [stock, setStock] = useState('')
  const [tipo, setTipo] = useState('Analgésico')

  const [busqueda, setBusqueda] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('Todos')
  const [orden, setOrden] = useState('nombre-az')

  const [editando, setEditando] = useState<Medicamento | null>(null)

  useEffect(() => {
    obtenerMedicamentos()
  }, [])

  async function obtenerMedicamentos() {
    const { data, error } = await supabase
      .from('medicamentos')
      .select('*')
      .order('id', { ascending: true })

    if (error) {
      console.log(error)
      alert('Error al cargar medicamentos')
      return
    }

    setMedicamentos(data || [])
  }

  async function guardarMedicamento(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (nombre.trim() === '') {
      alert('El nombre es obligatorio')
      return
    }

    if (Number(precio) <= 0) {
      alert('El precio debe ser mayor a 0')
      return
    }

    if (Number(stock) < 0 || stock === '') {
      alert('El stock debe ser mayor o igual a 0')
      return
    }

    const medicamento = {
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      precio: Number(precio),
      stock: Number(stock),
      tipo,
    }

    if (editando) {
      const { error } = await supabase
        .from('medicamentos')
        .update(medicamento)
        .eq('id', editando.id)

      if (error) {
        console.log(error)
        alert('Error al actualizar')
        return
      }
    } else {
      const { error } = await supabase.from('medicamentos').insert([medicamento])

      if (error) {
        console.log(error)
        alert('Error al guardar: ' + error.message)
        return
      }
    }

    limpiarFormulario()
    obtenerMedicamentos()
  }

  function seleccionarEditar(medicamento: Medicamento) {
    setEditando(medicamento)
    setNombre(medicamento.nombre)
    setDescripcion(medicamento.descripcion || '')
    setPrecio(String(medicamento.precio))
    setStock(String(medicamento.stock))
    setTipo(medicamento.tipo)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function eliminarMedicamento(id: number) {
    const confirmar = confirm('¿Seguro que deseas eliminar este medicamento?')

    if (!confirmar) return

    const { error } = await supabase.from('medicamentos').delete().eq('id', id)

    if (error) {
      console.log(error)
      alert('Error al eliminar')
      return
    }

    obtenerMedicamentos()
  }

  function limpiarFormulario() {
    setNombre('')
    setDescripcion('')
    setPrecio('')
    setStock('')
    setTipo('Analgésico')
    setEditando(null)
  }

  function limpiarFiltros() {
    setBusqueda('')
    setFiltroTipo('Todos')
    setOrden('nombre-az')
  }

  const medicamentosFiltrados = useMemo(() => {
    const lista = medicamentos.filter((medicamento) => {
      const coincideNombre = medicamento.nombre
        .toLowerCase()
        .includes(busqueda.toLowerCase())

      const coincideTipo =
        filtroTipo === 'Todos' || medicamento.tipo === filtroTipo

      return coincideNombre && coincideTipo
    })

    return lista.sort((a, b) => {
      if (orden === 'nombre-az') return a.nombre.localeCompare(b.nombre)
      if (orden === 'precio-menor') return Number(a.precio) - Number(b.precio)
      if (orden === 'precio-mayor') return Number(b.precio) - Number(a.precio)
      return 0
    })
  }, [medicamentos, busqueda, filtroTipo, orden])

  const valorTotal = medicamentos.reduce((total, medicamento) => {
    return total + Number(medicamento.precio) * Number(medicamento.stock)
  }, 0)

  const stockBajo = medicamentos.filter((m) => Number(m.stock) < 5).length

  return (
    <main className="contenedor">
      <header className="header">
        <div>
          <h1>Farmacia</h1>
          <p>Inventario de medicamentos</p>
        </div>

        <nav>
          <a href="#registro">Registro</a>
          <a href="#medicamentos">Medicamentos</a>
        </nav>
      </header>

      <section className="resumen">
        <div className="resumen-card">
          <span>Medicamentos</span>
          <strong>{medicamentos.length}</strong>
        </div>

        <div className="resumen-card">
          <span>Stock bajo</span>
          <strong className="texto-rojo">{stockBajo}</strong>
        </div>

        <div className="resumen-card">
          <span>Valor total</span>
          <strong>${valorTotal.toFixed(2)}</strong>
        </div>
      </section>

      <section className="grid-principal">
        <section className="panel" id="registro">
          <h2>{editando ? 'Editar medicamento' : 'Nuevo medicamento'}</h2>

          <form onSubmit={guardarMedicamento}>
            <label>
              Nombre
              <input
                type="text"
                placeholder="Ej. Ibuprofeno"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </label>

            <label>
              Descripción
              <textarea
                rows={3}
                placeholder="Ej. Alivia dolor e inflamación"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
              />
            </label>

            <div className="fila">
              <label>
                Precio
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="12.50"
                  value={precio}
                  onChange={(e) => setPrecio(e.target.value)}
                />
              </label>

              <label>
                Stock
                <input
                  type="number"
                  min="0"
                  placeholder="20"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                />
              </label>
            </div>

            <label>
              Tipo
              <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
                {tipos.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <div className="botones">
              <button className="btn btn-azul" type="submit">
                {editando ? 'Actualizar' : 'Guardar'}
              </button>

              <button className="btn btn-gris" type="button" onClick={limpiarFormulario}>
                Limpiar
              </button>
            </div>
          </form>
        </section>

        <section className="derecha">
          <section className="panel filtros">
            <div className="filtros-header">
              <h2>Filtros</h2>
              <button className="btn btn-gris" type="button" onClick={limpiarFiltros}>
                Limpiar filtros
              </button>
            </div>

            <div className="filtros-grid">
              <label>
                Buscar
                <input
                  type="text"
                  placeholder="Nombre..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </label>

              <label>
                Tipo
                <select
                  value={filtroTipo}
                  onChange={(e) => setFiltroTipo(e.target.value)}
                >
                  <option value="Todos">Todos</option>
                  {tipos.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Orden
                <select value={orden} onChange={(e) => setOrden(e.target.value)}>
                  <option value="nombre-az">Nombre A-Z</option>
                  <option value="precio-menor">Precio menor a mayor</option>
                  <option value="precio-mayor">Precio mayor a menor</option>
                </select>
              </label>
            </div>
          </section>

          <section className="lista-header" id="medicamentos">
            <h2>Medicamentos</h2>
            <p>
              {medicamentosFiltrados.length} de {medicamentos.length}
            </p>
          </section>

          <section className="lista">
            {medicamentosFiltrados.length === 0 ? (
              <div className="vacio">
                <h3>No hay resultados</h3>
                <p>Prueba con otro filtro o registra un medicamento.</p>
              </div>
            ) : (
              medicamentosFiltrados.map((medicamento) => (
                <article
                  className={
                    medicamento.stock < 5 ? 'card card-alerta' : 'card'
                  }
                  key={medicamento.id}
                >
                  <div className="card-top">
                    <div>
                      <h3>{medicamento.nombre}</h3>
                      <span>{medicamento.tipo}</span>
                    </div>

                    {medicamento.stock === 0 && (
                      <small className="etiqueta negra">Sin stock</small>
                    )}

                    {medicamento.stock > 0 && medicamento.stock < 5 && (
                      <small className="etiqueta roja">Stock bajo</small>
                    )}

                    {medicamento.stock >= 5 && (
                      <small className="etiqueta verde">Disponible</small>
                    )}
                  </div>

                  <p className="descripcion">
                    {medicamento.descripcion || 'Sin descripción'}
                  </p>

                  <div className="datos">
                    <div>
                      <span>Precio</span>
                      <strong>${Number(medicamento.precio).toFixed(2)}</strong>
                    </div>

                    <div>
                      <span>Stock</span>
                      <strong>{medicamento.stock}</strong>
                    </div>

                    <div>
                      <span>Valor</span>
                      <strong>
                        $
                        {(
                          Number(medicamento.precio) * Number(medicamento.stock)
                        ).toFixed(2)}
                      </strong>
                    </div>
                  </div>

                  <div className="acciones">
                    <button
                      className="btn btn-azul"
                      type="button"
                      onClick={() => seleccionarEditar(medicamento)}
                    >
                      Editar
                    </button>

                    <button
                      className="btn btn-rojo"
                      type="button"
                      onClick={() => eliminarMedicamento(medicamento.id)}
                    >
                      Eliminar
                    </button>
                  </div>
                </article>
              ))
            )}
          </section>
        </section>
      </section>
    </main>
  )
}

export default App