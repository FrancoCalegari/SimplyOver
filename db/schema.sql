-- ============================================================
-- SimplyOver — DDL Schema (PostgreSQL)
-- Versión: 1.0.0
-- Generado: 2026-06-09
-- Base de datos objetivo: sw_Franco Calegari_simplyover
-- ============================================================
-- Convenciones:
--   • IDs: UUID (gen_random_uuid()) para entidades principales
--   • Timestamps: TIMESTAMPTZ (timezone-aware)
--   • Storage: solo se persisten IDs devueltos por SpiderWeb Storage
--   • Precios: NUMERIC(10,2) — soporta valor 0.00 para gratuitos
-- ============================================================

-- Extensiones requeridas
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pg_trgm";   -- Full-text trigram search

-- ============================================================
-- MÓDULO 1 — USUARIOS, AUTENTICACIÓN Y PERFILES
-- ============================================================

CREATE TABLE users (
    id                   UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    username             VARCHAR(50)     NOT NULL UNIQUE,
    email                VARCHAR(255)    NOT NULL UNIQUE,
    password_hash        VARCHAR(255)    NOT NULL,                        -- bcrypt hash
    display_name         VARCHAR(100),
    bio                  TEXT,
    avatar_storage_id    VARCHAR(100),                                    -- ID en SpiderWeb Storage
    banner_storage_id    VARCHAR(100),                                    -- ID banner de perfil

    -- Redes sociales / enlaces de artista
    link_instagram       VARCHAR(255),
    link_pinterest       VARCHAR(255),
    link_twitch          VARCHAR(255),
    link_kick            VARCHAR(255),
    link_tiktok          VARCHAR(255),
    link_web             VARCHAR(255),
    link_email           VARCHAR(255),

    -- Etiquetas de artista (array de tags libres)
    artist_tags          TEXT[],

    -- Estado de la cuenta
    role                 VARCHAR(20)     NOT NULL DEFAULT 'user'          -- 'user' | 'creator' | 'admin'
                         CHECK (role IN ('user', 'creator', 'admin')),
    status               VARCHAR(20)     NOT NULL DEFAULT 'active'
                         CHECK (status IN ('active', 'suspended', 'banned')),

    -- Timestamps
    created_at           TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Índices de búsqueda de usuarios
CREATE INDEX idx_users_username     ON users USING gin (username gin_trgm_ops);
CREATE INDEX idx_users_email        ON users (email);
CREATE INDEX idx_users_role         ON users (role);
CREATE INDEX idx_users_status       ON users (status);
CREATE INDEX idx_users_artist_tags  ON users USING gin (artist_tags);


-- ============================================================
-- MÓDULO 2 — CATÁLOGO DE OVERLAYS
-- ============================================================

CREATE TABLE categories (
    id          SERIAL          PRIMARY KEY,
    slug        VARCHAR(80)     NOT NULL UNIQUE,
    name        VARCHAR(100)    NOT NULL,
    description TEXT,
    icon        VARCHAR(100),                  -- nombre de icono o emoji
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

INSERT INTO categories (slug, name, description) VALUES
    ('stream-alerts',   'Stream Alerts',        'Overlays de alertas para streams'),
    ('facecam-frames',  'Facecam Frames',        'Marcos para cámara de cara'),
    ('panels',          'Panels',                'Paneles de información'),
    ('overlays-full',   'Full Overlays',         'Paquetes completos de overlay'),
    ('widgets',         'Widgets',               'Widgets individuales'),
    ('transitions',     'Transitions',           'Transiciones de escena'),
    ('screens',         'Screens',               'Pantallas (BRB, Offline, etc.)'),
    ('bundles',         'Bundles',               'Paquetes combinados');


CREATE TABLE overlays (
    id                   UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id           UUID            NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name                 VARCHAR(200)    NOT NULL,
    slug                 VARCHAR(250)    NOT NULL UNIQUE,                 -- URL-friendly
    description          TEXT,
    short_description    VARCHAR(500),

    -- Precio (0.00 = gratuito)
    price                NUMERIC(10, 2)  NOT NULL DEFAULT 0.00
                         CHECK (price >= 0),
    currency             VARCHAR(3)      NOT NULL DEFAULT 'ARS',

    -- Tags libres (array PostgreSQL)
    tags                 TEXT[],

    -- Estado de moderación
    status               VARCHAR(20)     NOT NULL DEFAULT 'DRAFT'
                         CHECK (status IN ('DRAFT', 'PENDING', 'APPROVED', 'BANNED')),

    -- Assets (IDs en SpiderWeb Storage)
    zip_storage_id       VARCHAR(100),                                    -- instalador .zip
    preview_storage_ids  TEXT[],                                          -- array de IDs de capturas

    -- SEO / metadata adicional
    software_version     VARCHAR(50),                                     -- versión de OBS compatible
    resolution           VARCHAR(20),                                     -- '1920x1080', '2560x1440', etc.
    is_featured          BOOLEAN         NOT NULL DEFAULT FALSE,
    view_count           INTEGER         NOT NULL DEFAULT 0,
    download_count       INTEGER         NOT NULL DEFAULT 0,

    -- Timestamps
    created_at           TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    published_at         TIMESTAMPTZ                                      -- cuando pasa a APPROVED
);

-- Índices overlay
CREATE INDEX idx_overlays_creator      ON overlays (creator_id);
CREATE INDEX idx_overlays_status       ON overlays (status);
CREATE INDEX idx_overlays_price        ON overlays (price);
CREATE INDEX idx_overlays_featured     ON overlays (is_featured);
CREATE INDEX idx_overlays_name_trgm    ON overlays USING gin (name gin_trgm_ops);
CREATE INDEX idx_overlays_desc_trgm    ON overlays USING gin (description gin_trgm_ops);
CREATE INDEX idx_overlays_tags         ON overlays USING gin (tags);
CREATE INDEX idx_overlays_published    ON overlays (published_at DESC);


-- Relación N:M Overlays ↔ Categorías
CREATE TABLE overlay_categories (
    overlay_id    UUID     NOT NULL REFERENCES overlays(id) ON DELETE CASCADE,
    category_id   INTEGER  NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (overlay_id, category_id)
);


-- ============================================================
-- MÓDULO 2 (cont.) — RESEÑAS Y RATINGS
-- ============================================================

CREATE TABLE reviews (
    id           UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    overlay_id   UUID            NOT NULL REFERENCES overlays(id) ON DELETE CASCADE,
    user_id      UUID            NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    purchase_id  UUID            NOT NULL,                                -- FK a purchases (validación de compra)
    rating       SMALLINT        NOT NULL CHECK (rating BETWEEN 1 AND 10),
    title        VARCHAR(150),
    body         TEXT,
    created_at   TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    UNIQUE (overlay_id, user_id)                                         -- un review por usuario/overlay
);

CREATE INDEX idx_reviews_overlay ON reviews (overlay_id);
CREATE INDEX idx_reviews_user    ON reviews (user_id);
CREATE INDEX idx_reviews_rating  ON reviews (rating);


-- ============================================================
-- MÓDULO 3 — INTERACCIÓN SOCIAL: FAVORITOS (LIKES)
-- ============================================================

CREATE TABLE favorites (
    user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    overlay_id  UUID        NOT NULL REFERENCES overlays(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, overlay_id)
);

CREATE INDEX idx_favorites_overlay ON favorites (overlay_id);
CREATE INDEX idx_favorites_user    ON favorites (user_id);


-- ============================================================
-- MÓDULO 3 (cont.) — INTERACCIÓN SOCIAL: TABLEROS (BOARDS)
-- ============================================================

CREATE TABLE boards (
    id           UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id     UUID            NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name         VARCHAR(150)    NOT NULL,
    description  TEXT,
    cover_storage_id VARCHAR(100),                                        -- imagen portada del tablero
    visibility   VARCHAR(10)     NOT NULL DEFAULT 'public'
                 CHECK (visibility IN ('public', 'private')),
    created_at   TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_boards_owner      ON boards (owner_id);
CREATE INDEX idx_boards_visibility ON boards (visibility);


-- Tabla intermedia: overlays guardados dentro de un tablero
CREATE TABLE board_items (
    board_id    UUID        NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    overlay_id  UUID        NOT NULL REFERENCES overlays(id) ON DELETE CASCADE,
    note        TEXT,                                                     -- nota personal del usuario
    added_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (board_id, overlay_id)
);

CREATE INDEX idx_board_items_overlay ON board_items (overlay_id);


-- ============================================================
-- MÓDULO 6 — WORKFLOW DE COMPRA Y POST-VENTA
-- ============================================================

CREATE TABLE purchases (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id            UUID            NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    overlay_id          UUID            NOT NULL REFERENCES overlays(id) ON DELETE RESTRICT,
    creator_id          UUID            NOT NULL REFERENCES users(id) ON DELETE RESTRICT,

    -- Detalles económicos al momento de la compra (snapshot)
    amount_paid         NUMERIC(10, 2)  NOT NULL,
    currency            VARCHAR(3)      NOT NULL DEFAULT 'ARS',

    -- Pasarela de pago (Mercado Pago)
    payment_provider    VARCHAR(50)     NOT NULL DEFAULT 'mercadopago',
    mp_payment_id       VARCHAR(100)    UNIQUE,                           -- ID de Mercado Pago
    mp_preference_id    VARCHAR(100),
    mp_status           VARCHAR(50),                                      -- 'approved', 'pending', 'rejected'

    -- Estado interno
    status              VARCHAR(20)     NOT NULL DEFAULT 'PENDING'
                        CHECK (status IN ('PENDING', 'COMPLETED', 'REFUNDED', 'FAILED')),

    -- Descarga
    download_token      VARCHAR(255)    UNIQUE,                           -- token ofuscado para descarga segura
    download_count      SMALLINT        NOT NULL DEFAULT 0,
    download_limit      SMALLINT        NOT NULL DEFAULT 5,

    -- Email transaccional
    email_sent_at       TIMESTAMPTZ,

    -- Timestamps (formato requerido: YYYY-MM-DD HH:mm:ss.SSS)
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    completed_at        TIMESTAMPTZ,
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_purchases_buyer      ON purchases (buyer_id);
CREATE INDEX idx_purchases_overlay    ON purchases (overlay_id);
CREATE INDEX idx_purchases_creator    ON purchases (creator_id);
CREATE INDEX idx_purchases_status     ON purchases (status);
CREATE INDEX idx_purchases_mp_id      ON purchases (mp_payment_id);
CREATE INDEX idx_purchases_token      ON purchases (download_token);


-- ============================================================
-- MÓDULO 5 — ESTUDIO DE CREACIÓN (DESIGNER / CANVAS)
-- ============================================================

CREATE TABLE canvas_drafts (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id      UUID            NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name            VARCHAR(200)    NOT NULL DEFAULT 'Sin título',
    canvas_data     JSONB,                                                -- estado serializado del canvas (JSON)
    thumbnail_storage_id VARCHAR(100),                                    -- preview generado

    -- Relación con overlay (si ya se publicó)
    overlay_id      UUID            REFERENCES overlays(id) ON DELETE SET NULL,

    status          VARCHAR(20)     NOT NULL DEFAULT 'DRAFT'
                    CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),

    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_canvas_creator ON canvas_drafts (creator_id);
CREATE INDEX idx_canvas_status  ON canvas_drafts (status);


-- ============================================================
-- MÓDULO 5 (cont.) — INTERACCIONES CON SpiderIA
-- ============================================================

CREATE TABLE ia_sessions (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    draft_id     UUID        REFERENCES canvas_drafts(id) ON DELETE SET NULL,
    model_id     VARCHAR(100) NOT NULL,
    messages     JSONB       NOT NULL DEFAULT '[]',                       -- historial completo de mensajes
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ia_sessions_user  ON ia_sessions (user_id);
CREATE INDEX idx_ia_sessions_draft ON ia_sessions (draft_id);


-- ============================================================
-- MÓDULO 7 — ADMIN DASHBOARD
-- ============================================================

CREATE TABLE admin_audit_log (
    id           UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id     UUID            NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    action       VARCHAR(100)    NOT NULL,                                -- 'APPROVE_OVERLAY', 'BAN_USER', etc.
    entity_type  VARCHAR(50)     NOT NULL,                                -- 'overlay', 'user', 'purchase', etc.
    entity_id    UUID            NOT NULL,
    detail       JSONB,                                                   -- datos adicionales / diff del cambio
    ip_address   INET,
    created_at   TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_admin      ON admin_audit_log (admin_id);
CREATE INDEX idx_audit_entity     ON admin_audit_log (entity_type, entity_id);
CREATE INDEX idx_audit_created    ON admin_audit_log (created_at DESC);


-- ============================================================
-- VISTAS ÚTILES PARA EL FRONTEND
-- ============================================================

-- Vista: overlays con rating promedio y conteo de reviews
CREATE OR REPLACE VIEW overlay_ratings AS
SELECT
    o.id,
    o.name,
    o.slug,
    o.price,
    o.status,
    o.creator_id,
    o.tags,
    o.preview_storage_ids,
    o.is_featured,
    o.view_count,
    o.download_count,
    o.published_at,
    ROUND(AVG(r.rating)::NUMERIC, 2)  AS avg_rating,
    COUNT(r.id)                        AS review_count,
    COUNT(f.user_id)                   AS favorite_count
FROM overlays o
LEFT JOIN reviews  r ON r.overlay_id = o.id
LEFT JOIN favorites f ON f.overlay_id = o.id
GROUP BY o.id;

-- Vista: historial de compras con detalles del producto y creador
CREATE OR REPLACE VIEW purchase_history AS
SELECT
    p.id             AS purchase_id,
    p.buyer_id,
    p.status         AS purchase_status,
    p.amount_paid,
    p.currency,
    p.mp_status,
    p.download_token,
    p.download_count,
    p.download_limit,
    p.completed_at,
    p.created_at     AS purchased_at,
    o.id             AS overlay_id,
    o.name           AS overlay_name,
    o.slug           AS overlay_slug,
    o.zip_storage_id,
    u.id             AS creator_id,
    u.username       AS creator_username,
    u.display_name   AS creator_display_name
FROM purchases   p
JOIN overlays    o ON o.id = p.overlay_id
JOIN users       u ON u.id = p.creator_id;

-- Vista: tableros con conteo de items y datos del owner
CREATE OR REPLACE VIEW board_details AS
SELECT
    b.id,
    b.name,
    b.description,
    b.visibility,
    b.cover_storage_id,
    b.created_at,
    b.owner_id,
    u.username       AS owner_username,
    u.avatar_storage_id AS owner_avatar,
    COUNT(bi.overlay_id) AS item_count
FROM boards b
JOIN users  u  ON u.id = b.owner_id
LEFT JOIN board_items bi ON bi.board_id = b.id
GROUP BY b.id, u.id;


-- ============================================================
-- TRIGGER: auto-actualizar updated_at en todas las tablas
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated          BEFORE UPDATE ON users          FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_overlays_updated       BEFORE UPDATE ON overlays       FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_reviews_updated        BEFORE UPDATE ON reviews        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_boards_updated         BEFORE UPDATE ON boards         FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_purchases_updated      BEFORE UPDATE ON purchases      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_canvas_updated         BEFORE UPDATE ON canvas_drafts  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_ia_sessions_updated    BEFORE UPDATE ON ia_sessions    FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ============================================================
-- FK diferida: reviews → purchases (evita dependencia circular)
-- ============================================================
ALTER TABLE reviews
    ADD CONSTRAINT fk_reviews_purchase
    FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE RESTRICT;

-- ============================================================
-- FIN DEL SCRIPT
-- ============================================================
