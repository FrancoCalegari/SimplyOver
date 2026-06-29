/**
 * GET    /api/overlays/[slug]   — Detalle público de un overlay
 * PATCH  /api/overlays/[slug]   — Actualizar overlay (solo el creador o admin)
 * DELETE /api/overlays/[slug]   — Eliminar overlay (solo el creador o admin)
 */

import { spiderWeb }   from '@/lib/SpiderWebService.js'
import { requireAuth } from '@/lib/auth.js'
import {
  ok, badRequest, forbidden, notFound, serverError,
  sanitize, isValidUUID,
} from '@/lib/apiResponse.js'

/** GET /api/overlays/[slug] */
export async function GET(request, { params }) {
  try {
    const slug    = sanitize(params.slug)
    const overlay = await spiderWeb.getOverlayBySlug(slug)
    if (!overlay) return notFound('Overlay')

    // Registrar vista en background (fire-and-forget)
    spiderWeb.incrementOverlayViews(overlay.id).catch(() => {})

    // Obtener categorías del overlay
    const categories = await spiderWeb.query(
      `SELECT c.id, c.slug, c.name, c.icon
       FROM categories c
       JOIN overlay_categories oc ON oc.category_id = c.id
       WHERE oc.overlay_id = '${overlay.id}'`
    )

    // URLs de preview (transformar IDs a URLs)
    const previewUrls = (overlay.preview_storage_ids ?? [])
      .map((id) => ({ id, url: spiderWeb.getFileUrl(id) }))

    return ok({ ...overlay, categories, previewUrls })
  } catch (err) {
    return serverError(err)
  }
}

/** PATCH /api/overlays/[slug] */
export async function PATCH(request, { params }) {
  try {
    const { session, error } = await requireAuth(request)
    if (error) return error

    const slug    = sanitize(params.slug)
    const overlay = await spiderWeb.queryOne(
      `SELECT id, creator_id FROM overlays WHERE slug = '${slug}' LIMIT 1`
    )
    if (!overlay) return notFound('Overlay')

    if (overlay.creator_id !== session.id && session.role !== 'admin') {
      return forbidden('No tenés permisos para editar este overlay.')
    }

    const body = await request.json()
    const sets = []

    const textFields = { name: 'name', description: 'description', shortDescription: 'short_description' }
    for (const [jsKey, sqlCol] of Object.entries(textFields)) {
      if (body[jsKey] !== undefined) {
        sets.push(`${sqlCol} = '${sanitize(body[jsKey])}'`)
      }
    }

    if (body.price !== undefined) {
      const p = parseFloat(body.price)
      if (isNaN(p) || p < 0) return badRequest('Precio inválido.')
      sets.push(`price = ${p}`)
    }

    if (body.tags !== undefined && Array.isArray(body.tags)) {
      const tagsLiteral = body.tags.map((t) => `"${sanitize(String(t))}"`).join(',')
      sets.push(`tags = '{${tagsLiteral}}'`)
    }

    if (sets.length === 0) return badRequest('No se proporcionaron campos para actualizar.')

    const updated = await spiderWeb.queryOne(
      `UPDATE overlays SET ${sets.join(', ')}, status = 'PENDING'
       WHERE id = '${overlay.id}'
       RETURNING id, name, slug, price, status, updated_at`
    )

    return ok({ overlay: updated, message: 'Overlay actualizado. Volvió a estado PENDING para revisión.' })
  } catch (err) {
    return serverError(err)
  }
}

/** DELETE /api/overlays/[slug] */
export async function DELETE(request, { params }) {
  try {
    const { session, error } = await requireAuth(request)
    if (error) return error

    const slug    = sanitize(params.slug)
    const overlay = await spiderWeb.queryOne(
      `SELECT id, creator_id, status FROM overlays WHERE slug = '${slug}' LIMIT 1`
    )
    if (!overlay) return notFound('Overlay')

    if (overlay.creator_id !== session.id && session.role !== 'admin') {
      return forbidden('No tenés permisos para eliminar este overlay.')
    }

    await spiderWeb.query(`DELETE FROM overlays WHERE id = '${overlay.id}'`)
    return ok({ message: 'Overlay eliminado correctamente.' })
  } catch (err) {
    return serverError(err)
  }
}
