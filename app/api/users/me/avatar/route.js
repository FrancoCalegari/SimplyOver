/**
 * POST /api/users/me/avatar
 * Sube un avatar o banner para el usuario autenticado.
 *
 * FormData keys:
 *   - avatar (File) — imagen de perfil
 *   - banner (File) — imagen de portada
 */

import { spiderWeb }   from '@/lib/SpiderWebService.js'
import { requireAuth } from '@/lib/auth.js'
import { ok, badRequest, serverError } from '@/lib/apiResponse.js'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB

export async function POST(request) {
  try {
    const { session, error } = await requireAuth(request)
    if (error) return error

    const formData = await request.formData()
    const avatar   = formData.get('avatar')
    const banner   = formData.get('banner')

    if (!avatar && !banner) {
      return badRequest('Debés enviar al menos un campo: "avatar" o "banner".')
    }

    const updates = {}

    // Subir avatar
    if (avatar && avatar instanceof File) {
      if (!ALLOWED_TYPES.includes(avatar.type)) {
        return badRequest('Formato de avatar inválido. Se aceptan: JPEG, PNG, WebP, GIF.')
      }
      if (avatar.size > MAX_SIZE_BYTES) {
        return badRequest('El avatar no puede superar 5 MB.')
      }
      const [uploaded] = await spiderWeb.uploadFiles(avatar)
      updates.avatarStorageId = String(uploaded.id ?? uploaded.file_id ?? uploaded)
    }

    // Subir banner
    if (banner && banner instanceof File) {
      if (!ALLOWED_TYPES.includes(banner.type)) {
        return badRequest('Formato de banner inválido. Se aceptan: JPEG, PNG, WebP, GIF.')
      }
      if (banner.size > MAX_SIZE_BYTES) {
        return badRequest('El banner no puede superar 5 MB.')
      }
      const [uploaded] = await spiderWeb.uploadFiles(banner)
      updates.bannerStorageId = String(uploaded.id ?? uploaded.file_id ?? uploaded)
    }

    const updated = await spiderWeb.updateUserProfile(session.id, updates)

    return ok({
      message: 'Imagen(es) actualizada(s) correctamente.',
      user:    updated,
      urls: {
        avatar: updates.avatarStorageId
          ? spiderWeb.getFileUrl(updates.avatarStorageId)
          : undefined,
        banner: updates.bannerStorageId
          ? spiderWeb.getFileUrl(updates.bannerStorageId)
          : undefined,
      },
    })
  } catch (err) {
    return serverError(err)
  }
}
