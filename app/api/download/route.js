/**
 * GET /api/download?token=xxx
 * Descarga segura de un overlay .zip mediante token ofuscado.
 *
 * - Valida que el token existe, la compra está COMPLETED y no superó el límite.
 * - Hace stream del archivo desde SpiderWeb Storage.
 * - Incrementa el contador de descargas.
 */

import { spiderWeb } from '@/lib/SpiderWebService.js'
import { badRequest, notFound, forbidden, serverError } from '@/lib/apiResponse.js'
import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const token            = searchParams.get('token')?.trim()

    if (!token) return badRequest('Token de descarga requerido.')

    // Validar token y límites
    const purchase = await spiderWeb.getPurchaseByToken(token)
    if (!purchase) {
      return forbidden('Token de descarga inválido, expirado o límite de descargas alcanzado.')
    }

    if (!purchase.zip_storage_id) {
      return notFound('Archivo de overlay')
    }

    // ── Descargar desde SpiderWeb Storage ─────────────────
    const fileBuffer = await spiderWeb.downloadFile(purchase.zip_storage_id)

    // Incrementar contador (fire-and-forget)
    spiderWeb.recordDownload(purchase.id).catch(() => {})

    // ── Construir respuesta con stream ─────────────────────
    const safeFilename = encodeURIComponent(
      `${purchase.overlay_name ?? 'overlay'}.zip`
    )

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type':        'application/zip',
        'Content-Disposition': `attachment; filename="${safeFilename}"`,
        'Content-Length':      String(fileBuffer.byteLength),
        'Cache-Control':       'no-store, no-cache',
        'X-Purchase-ID':       purchase.id,
        'X-Downloads-Used':    String(purchase.download_count + 1),
        'X-Downloads-Limit':   String(purchase.download_limit),
      },
    })
  } catch (err) {
    return serverError(err)
  }
}
