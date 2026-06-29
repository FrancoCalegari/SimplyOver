/**
 * GET /api/ia/models
 * Lista los modelos de IA disponibles en SpiderIA.
 * Requiere autenticación.
 */

import { spiderWeb }   from '@/lib/SpiderWebService.js'
import { requireAuth } from '@/lib/auth.js'
import { ok, serverError } from '@/lib/apiResponse.js'

export async function GET(request) {
  try {
    const { error } = await requireAuth(request)
    if (error) return error

    const models = await spiderWeb.getIAModels()
    return ok(models)
  } catch (err) {
    return serverError(err)
  }
}
