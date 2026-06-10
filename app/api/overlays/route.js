/**
 * GET  /api/overlays  — Lista overlays aprobados con filtros y paginación
 * POST /api/overlays  — Crea un nuevo overlay (requiere auth + rol creator/admin)
 *
 * GET Query params:
 *   page, limit, category, minRating, onlyFree, sortBy (rating|new|popular)
 */

import { spiderWeb }   from '@/lib/SpiderWebService.js'
import { requireAuth } from '@/lib/auth.js'
import {
  ok, created, badRequest, forbidden, serverError,
  sanitize, parsePagination,
} from '@/lib/apiResponse.js'

function slugify(str) {
  return str
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/** GET /api/overlays */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const { page, limit }  = parsePagination(searchParams)
    const category         = searchParams.get('category') ?? null
    const minRating        = searchParams.get('minRating') ?? null
    const onlyFree         = searchParams.get('onlyFree') === 'true'
    const sortBy           = searchParams.get('sortBy') ?? 'rating' // rating | new | popular

    let orderClause = 'r.avg_rating DESC NULLS LAST, r.favorite_count DESC'
    if (sortBy === 'new')     orderClause = 'o.published_at DESC'
    if (sortBy === 'popular') orderClause = 'o.view_count DESC, r.favorite_count DESC'

    const offset = (page - 1) * limit
    const joins  = []
    let where    = `o.status = 'APPROVED'`

    if (category) {
      const safe = sanitize(category)
      joins.push(`JOIN overlay_categories oc ON oc.overlay_id = o.id
                  JOIN categories c ON c.id = oc.category_id AND c.slug = '${safe}'`)
    }
    if (onlyFree) where += ` AND o.price = 0`
    if (minRating) {
      const mr = parseFloat(minRating)
      if (!isNaN(mr)) where += ` AND r.avg_rating >= ${mr}`
    }

    const overlays = await spiderWeb.query(
      `SELECT r.*
       FROM overlay_ratings r
       JOIN overlays o ON o.id = r.id
       ${joins.join('\n')}
       WHERE ${where}
       ORDER BY ${orderClause}
       LIMIT ${limit} OFFSET ${offset}`
    )

    const totalRow = await spiderWeb.queryOne(
      `SELECT COUNT(DISTINCT o.id) AS total
       FROM overlays o
       ${joins.join('\n')}
       WHERE ${where}`
    )

    return ok(overlays, {
      meta: {
        page,
        limit,
        total: parseInt(totalRow?.total ?? 0),
        totalPages: Math.ceil(parseInt(totalRow?.total ?? 0) / limit),
      },
    })
  } catch (err) {
    return serverError(err)
  }
}

/** POST /api/overlays */
export async function POST(request) {
  try {
    const { session, error } = await requireAuth(request)
    if (error) return error

    if (!['creator', 'admin'].includes(session.role)) {
      return forbidden('Solo los creadores pueden publicar overlays. Actualizá tu rol en el perfil.')
    }

    const formData    = await request.formData()
    const name        = formData.get('name')
    const description = formData.get('description') ?? ''
    const shortDesc   = formData.get('shortDescription') ?? ''
    const price       = parseFloat(formData.get('price') ?? '0')
    const currency    = formData.get('currency') ?? 'ARS'
    const tagsRaw     = formData.get('tags') ?? '[]'
    const categories  = formData.getAll('categories')
    const resolution  = formData.get('resolution') ?? null
    const obsVersion  = formData.get('obsVersion') ?? null
    const zipFile     = formData.get('zip')
    const screenshots = formData.getAll('screenshots')

    // ── Validaciones ────────────────────────────────────────
    if (!name || name.trim().length < 3) {
      return badRequest('El nombre del overlay debe tener al menos 3 caracteres.')
    }
    if (isNaN(price) || price < 0) {
      return badRequest('El precio debe ser un número positivo (0 para gratuito).')
    }
    if (!zipFile || !(zipFile instanceof File)) {
      return badRequest('Debés adjuntar el archivo .zip del overlay.')
    }
    if (!zipFile.name.endsWith('.zip')) {
      return badRequest('El instalador debe ser un archivo .zip.')
    }
    if (zipFile.size > 100 * 1024 * 1024) {
      return badRequest('El archivo .zip no puede superar 100 MB.')
    }

    let tags = []
    try { tags = JSON.parse(tagsRaw) } catch { tags = [] }
    tags = tags.map((t) => sanitize(String(t))).slice(0, 15)

    const safeName     = sanitize(name)
    const safeDesc     = sanitize(description)
    const safeShort    = sanitize(shortDesc)
    const baseSlug     = slugify(name)
    const uniqueSuffix = Date.now().toString(36)
    const slug         = `${baseSlug}-${uniqueSuffix}`

    // ── Upload archivos a Storage ───────────────────────────
    const [uploadedZip] = await spiderWeb.uploadFiles(zipFile)
    const zipStorageId  = String(uploadedZip.id ?? uploadedZip.file_id ?? uploadedZip)

    let previewIds = []
    if (screenshots.length > 0) {
      const ALLOWED = ['image/jpeg', 'image/png', 'image/webp']
      for (const sc of screenshots) {
        if (!ALLOWED.includes(sc.type)) {
          return badRequest(`Tipo de captura inválido: ${sc.type}. Se aceptan JPEG, PNG, WebP.`)
        }
      }
      const uploadedPreviews = await spiderWeb.uploadFiles(screenshots)
      previewIds = (Array.isArray(uploadedPreviews) ? uploadedPreviews : [uploadedPreviews])
        .map((u) => String(u.id ?? u.file_id ?? u))
    }

    // ── Insertar en DB ──────────────────────────────────────
    const tagsLiteral    = tags.map((t) => `"${t}"`).join(',')
    const previewLiteral = previewIds.map((id) => `"${id}"`).join(',')
    const resVal         = resolution ? `'${sanitize(resolution)}'` : 'NULL'
    const obsVal         = obsVersion ? `'${sanitize(obsVersion)}'` : 'NULL'

    const overlay = await spiderWeb.queryOne(
      `INSERT INTO overlays
         (creator_id, name, slug, description, short_description, price, currency,
          tags, zip_storage_id, preview_storage_ids, resolution, software_version, status)
       VALUES
         ('${session.id}', '${safeName}', '${slug}', '${safeDesc}', '${safeShort}',
          ${price}, '${sanitize(currency)}', '{${tagsLiteral}}',
          '${zipStorageId}', '{${previewLiteral}}',
          ${resVal}, ${obsVal}, 'PENDING')
       RETURNING id, name, slug, price, status, created_at`
    )

    // ── Asociar categorías ──────────────────────────────────
    if (categories.length > 0) {
      for (const catId of categories) {
        const safeId = parseInt(catId, 10)
        if (!isNaN(safeId)) {
          await spiderWeb.query(
            `INSERT INTO overlay_categories (overlay_id, category_id)
             VALUES ('${overlay.id}', ${safeId})
             ON CONFLICT DO NOTHING`
          )
        }
      }
    }

    return created({
      overlay,
      message: 'Overlay enviado correctamente. Quedará en revisión antes de publicarse.',
    })
  } catch (err) {
    return serverError(err)
  }
}
