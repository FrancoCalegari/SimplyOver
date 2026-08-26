/**
 * lib/db.js
 * Wrapper simplificado de SpiderWeb para Express (sin Next.js).
 * Exporta una función `query(sql, params)` para ejecutar sentencias SQL.
 */

import dotenv from 'dotenv'
dotenv.config()

const BASE_URL  = process.env.SPIDERWEBURL    ?? 'https://spiderwebargapi.com.ar/api/v1'
const API_KEY   = process.env.SPIDERWEBAPIKEY ?? ''
const DB_NAME   = process.env.SPIDERWEBDB     ?? ''

/**
 * Ejecuta una query SQL via SpiderWeb API.
 * @param {string} sql  — sentencia SQL (puede incluir ? como placeholders)
 * @param {Array}  params — valores para los placeholders
 * @returns {Promise<Array>} filas resultado
 */
export async function query(sql, params = []) {
  // Interpolar params de forma segura (escape básico)
  let finalSql = sql
  if (params.length > 0) {
    let i = 0
    finalSql = sql.replace(/\?/g, () => {
      const val = params[i++]
      if (val === null || val === undefined) return 'NULL'
      if (typeof val === 'number') return val
      return `'${String(val).replace(/'/g, "''")}'`
    })
  }

  const response = await fetch(`${BASE_URL}/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': API_KEY,
    },
    body: JSON.stringify({ database: DB_NAME, query: finalSql }),
  })

  if (!response.ok) {
    let msg = `DB Error ${response.status}`
    try { msg += ': ' + JSON.stringify(await response.json()) } catch {}
    throw new Error(msg)
  }

  const data = await response.json()
  // SpiderWeb devuelve { data: [...] } o directamente un array
  return Array.isArray(data) ? data : (data.data ?? data.rows ?? data.result ?? [])
}

/**
 * Ejecuta una query y devuelve solo la primera fila (o null).
 * @param {string} sql
 * @param {Array}  params
 * @returns {Promise<object|null>}
 */
export async function queryOne(sql, params = []) {
  const rows = await query(sql, params)
  return rows[0] ?? null
}

/**
 * Genera un UUID v4 simple para insertar registros.
 * Usar en lugar de UUID() de MySQL cuando se necesita el ID generado.
 */
export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

export default { query, queryOne, generateUUID }
