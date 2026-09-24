/**
 * middleware/categories.js
 * Carga categorías globalmente en res.locals para que todas las vistas
 * (incluyendo navbar) puedan acceder a ellas sin necesidad de pasarlas manualmente.
 */
import { query } from '../lib/db.js';

export async function loadCategories(req, res, next) {
  try {
    if (!res.locals.categories) {
      res.locals.categories = await query(
        'SELECT id, slug, name, icon FROM categories ORDER BY name ASC',
        []
      );
    }
  } catch (err) {
    console.warn('[Middleware/Categories]', err.message);
    res.locals.categories = [];
  }
  next();
}
