/**
 * routes/categories.js
 * Ruta de categorías: muestra overlays filtrados por slug de categoría.
 */

import { Router } from 'express'
import { query, queryOne } from '../lib/db.js'

const router = Router()

// Mapa de slugs UI a slugs de DB (el navbar usa slugs simples)
const CATEGORY_SLUGS = {
  anime:       ['anime', 'kawaii', 'manga'],
  esports:     ['esports', 'competitive', 'gaming'],
  neon:        ['neon', 'cyberpunk', 'synthwave'],
  gaming:      ['gaming', 'game', 'controller'],
  all:         null, // sin filtro
}

// ─── GET /category/:slug ──────────────────────────────────────────────────────
router.get('/:slug', async (req, res) => {
  const { slug } = req.params
  const { q, price, sort = 'newest', page = 1 } = req.query
  const perPage = 20
  const offset = (parseInt(page) - 1) * perPage

  try {
    // Buscar la categoría en la DB por slug exacto primero
    let category = await queryOne(
      'SELECT id, name, slug, description, icon FROM categories WHERE slug = ? LIMIT 1',
      [slug]
    )

    // Si no hay categoría, buscar por nombre parcial
    if (!category) {
      category = { name: slug.charAt(0).toUpperCase() + slug.slice(1), slug, description: null }
    }

    // Construir query de overlays
    let sql = `
      SELECT o.id, o.name, o.slug, o.price, o.short_description,
             o.preview_storage_ids, o.tags, o.is_featured, o.view_count,
             u.username AS creator_username, u.display_name AS creator_display_name,
             u.avatar_storage_id AS creator_avatar,
             ROUND(AVG(r.rating), 1) AS avg_rating,
             COUNT(DISTINCT r.id) AS review_count
      FROM overlays o
      JOIN users u ON u.id = o.creator_id
      LEFT JOIN reviews r ON r.overlay_id = o.id
      LEFT JOIN overlay_categories oc ON oc.overlay_id = o.id
      LEFT JOIN categories c ON c.id = oc.category_id
      WHERE o.status = 'APPROVED'
    `
    const params = []

    // Filtro por categoría
    if (category.id) {
      sql += ' AND oc.category_id = ?'
      params.push(category.id)
    } else if (CATEGORY_SLUGS[slug]) {
      // Si el slug es del navbar, filtrar por tags JSON
      const tagList = CATEGORY_SLUGS[slug].map(t => `JSON_CONTAINS(o.tags, '"${t}"')`).join(' OR ')
      sql += ` AND (${tagList})`
    }

    // Filtro por búsqueda de texto
    if (q) {
      sql += ' AND (o.name LIKE ? OR o.short_description LIKE ?)'
      params.push(`%${q}%`, `%${q}%`)
    }

    // Filtro por precio
    if (price === 'free') {
      sql += ' AND o.price = 0'
    } else if (price === 'paid') {
      sql += ' AND o.price > 0'
    }

    sql += ' GROUP BY o.id, u.id'

    // Ordenamiento
    switch (sort) {
      case 'popular': sql += ' ORDER BY o.view_count DESC'; break
      case 'rating':  sql += ' ORDER BY avg_rating DESC'; break
      case 'price_asc': sql += ' ORDER BY o.price ASC'; break
      case 'price_desc': sql += ' ORDER BY o.price DESC'; break
      default: sql += ' ORDER BY o.published_at DESC'
    }

    sql += ` LIMIT ${perPage} OFFSET ${offset}`

    const overlays = await query(sql, params)

    res.render('category_view', {
      title: `${category.name} | SimplyOver`,
      category,
      overlays,
      filters: { q, price, sort },
      pagination: { page: parseInt(page), perPage, hasMore: overlays.length === perPage },
      slug,
    })
  } catch (err) {
    console.error('[Categories]', err)
    res.render('category_view', {
      title: `${slug} | SimplyOver`,
      category: { name: slug, slug, description: null },
      overlays: [],
      filters: { q, price, sort },
      pagination: { page: 1, perPage, hasMore: false },
      slug,
    })
  }
})

export default router
