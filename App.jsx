import { useEffect, useState } from 'react'
import axios from 'axios'

const api = axios.create({ baseURL: '/api' })


export default function App() {
  const [topFilms, setTopFilms] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  useEffect(() => {
    ;(async () => {
      try {
        const { data } = await api.get('/films/top?limit=5')
        setTopFilms(data)
      } catch (e) {
        console.error('API error:', e)
        setErr(e?.response?.data?.error || e.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: 16 }}>
      <h1>Sakila Store</h1>
      {loading && <p>Loading…</p>}
      {err && <p style={{ color: 'crimson' }}>Error: {err}</p>}
      {!loading && !err && (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {topFilms.map((f) => (
            <li
              key={f.film_id}
              style={{ padding: 12, marginBottom: 8, border: '1px solid #ddd', borderRadius: 8 }}
            >
              <div style={{ fontWeight: 600 }}>{f.title}</div>
              <div>Category: {f.category}</div>
              <div>Rentals: {f.rental_count}</div>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
