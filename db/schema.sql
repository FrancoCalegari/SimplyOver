-- ============================================================
-- SimplyOver — DDL Schema (MariaDB / MySQL)
-- Versión: 1.0.0
-- Generado: 2026-06-10
-- Base de datos objetivo: sw_Franco Calegari_simplyover
-- ============================================================

-- ============================================================
-- MÓDULO 1 — USUARIOS, AUTENTICACIÓN Y PERFILES
-- ============================================================

CREATE TABLE users (
    id                   UUID            PRIMARY KEY DEFAULT UUID(),
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

    -- Etiquetas de artista (JSON array de tags libres)
    artist_tags          JSON,

    -- Estado de la cuenta
    role                 VARCHAR(20)     NOT NULL DEFAULT 'user'
                         CHECK (role IN ('user', 'creator', 'admin')),
    status               VARCHAR(20)     NOT NULL DEFAULT 'active'
                         CHECK (status IN ('active', 'suspended', 'banned')),

    -- Timestamps
    created_at           TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Índices de búsqueda de usuarios
CREATE INDEX idx_users_username     ON users (username);
CREATE INDEX idx_users_email        ON users (email);
CREATE INDEX idx_users_role         ON users (role);
CREATE INDEX idx_users_status       ON users (status);


-- ============================================================
-- MÓDULO 2 — CATÁLOGO DE OVERLAYS
-- ============================================================

CREATE TABLE categories (
    id          INT             AUTO_INCREMENT PRIMARY KEY,
    slug        VARCHAR(80)     NOT NULL UNIQUE,
    name        VARCHAR(100)    NOT NULL,
    description TEXT,
    icon        VARCHAR(100),                  -- nombre de icono o emoji
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
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
    id                   UUID            PRIMARY KEY DEFAULT UUID(),
    creator_id           UUID            NOT NULL,
    name                 VARCHAR(200)    NOT NULL,
    slug                 VARCHAR(250)    NOT NULL UNIQUE,                 -- URL-friendly
    description          TEXT,
    short_description    VARCHAR(500),

    -- Precio (0.00 = gratuito)
    price                NUMERIC(10, 2)  NOT NULL DEFAULT 0.00
                         CHECK (price >= 0),
    currency             VARCHAR(3)      NOT NULL DEFAULT 'ARS',

    -- Tags libres (JSON array)
    tags                 JSON,

    -- Estado de moderación
    status               VARCHAR(20)     NOT NULL DEFAULT 'DRAFT'
                         CHECK (status IN ('DRAFT', 'PENDING', 'APPROVED', 'BANNED')),

    -- Assets (IDs en SpiderWeb Storage)
    zip_storage_id       VARCHAR(100),                                    -- instalador .zip
    preview_storage_ids  JSON,                                            -- JSON array de IDs de capturas

    -- SEO / metadata adicional
    software_version     VARCHAR(50),                                     -- versión de OBS compatible
    resolution           VARCHAR(20),                                     -- '1920x1080', '2560x1440', etc.
    is_featured          BOOLEAN         NOT NULL DEFAULT FALSE,
    view_count           INT             NOT NULL DEFAULT 0,
    download_count       INT             NOT NULL DEFAULT 0,

    -- Timestamps
    created_at           TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    published_at         TIMESTAMP       NULL,                            -- cuando pasa a APPROVED
    FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Índices overlay
CREATE INDEX idx_overlays_creator      ON overlays (creator_id);
CREATE INDEX idx_overlays_status       ON overlays (status);
CREATE INDEX idx_overlays_price        ON overlays (price);
CREATE INDEX idx_overlays_featured     ON overlays (is_featured);
CREATE INDEX idx_overlays_published    ON overlays (published_at DESC);


-- Relación N:M Overlays ↔ Categorías
CREATE TABLE overlay_categories (
    overlay_id    UUID     NOT NULL,
    category_id   INT      NOT NULL,
    PRIMARY KEY (overlay_id, category_id),
    FOREIGN KEY (overlay_id) REFERENCES overlays(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);


-- ============================================================
-- MÓDULO 2 (cont.) — RESEÑAS Y RATINGS
-- ============================================================

CREATE TABLE reviews (
    id           UUID            PRIMARY KEY DEFAULT UUID(),
    overlay_id   UUID            NOT NULL,
    user_id      UUID            NOT NULL,
    purchase_id  UUID            NOT NULL,                                -- FK a purchases (validación de compra)
    rating       SMALLINT        NOT NULL CHECK (rating BETWEEN 1 AND 10),
    title        VARCHAR(150),
    body         TEXT,
    created_at   TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE (overlay_id, user_id),                                         -- un review por usuario/overlay
    FOREIGN KEY (overlay_id) REFERENCES overlays(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_reviews_overlay ON reviews (overlay_id);
CREATE INDEX idx_reviews_user    ON reviews (user_id);
CREATE INDEX idx_reviews_rating  ON reviews (rating);


-- ============================================================
-- MÓDULO 3 — INTERACCIÓN SOCIAL: FAVORITOS (LIKES)
-- ============================================================

CREATE TABLE favorites (
    user_id     UUID        NOT NULL,
    overlay_id  UUID        NOT NULL,
    created_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, overlay_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (overlay_id) REFERENCES overlays(id) ON DELETE CASCADE
);

CREATE INDEX idx_favorites_overlay ON favorites (overlay_id);
CREATE INDEX idx_favorites_user    ON favorites (user_id);


-- ============================================================
-- MÓDULO 3 (cont.) — INTERACCIÓN SOCIAL: TABLEROS (BOARDS)
-- ============================================================

CREATE TABLE boards (
    id           UUID            PRIMARY KEY DEFAULT UUID(),
    owner_id     UUID            NOT NULL,
    name         VARCHAR(150)    NOT NULL,
    description  TEXT,
    cover_storage_id VARCHAR(100),                                        -- imagen portada del tablero
    visibility   VARCHAR(10)     NOT NULL DEFAULT 'public'
                 CHECK (visibility IN ('public', 'private')),
    created_at   TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_boards_owner      ON boards (owner_id);
CREATE INDEX idx_boards_visibility ON boards (visibility);


-- Tabla intermedia: overlays guardados dentro de un tablero
CREATE TABLE board_items (
    board_id    UUID        NOT NULL,
    overlay_id  UUID        NOT NULL,
    note        TEXT,                                                     -- nota personal del usuario
    added_at    TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (board_id, overlay_id),
    FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
    FOREIGN KEY (overlay_id) REFERENCES overlays(id) ON DELETE CASCADE
);

CREATE INDEX idx_board_items_overlay ON board_items (overlay_id);


-- ============================================================
-- MÓDULO 6 — WORKFLOW DE COMPRA Y POST-VENTA
-- ============================================================

CREATE TABLE purchases (
    id                  UUID            PRIMARY KEY DEFAULT UUID(),
    buyer_id            UUID            NOT NULL,
    overlay_id          UUID            NOT NULL,
    creator_id          UUID            NOT NULL,

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
    email_sent_at       TIMESTAMP       NULL,

    -- Timestamps
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at        TIMESTAMP       NULL,
    updated_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (overlay_id) REFERENCES overlays(id) ON DELETE RESTRICT,
    FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE RESTRICT
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
    id              UUID            PRIMARY KEY DEFAULT UUID(),
    creator_id      UUID            NOT NULL,
    name            VARCHAR(200)    NOT NULL DEFAULT 'Sin título',
    canvas_data     JSON,                                                 -- estado serializado del canvas (JSON)
    thumbnail_storage_id VARCHAR(100),                                    -- preview generado

    -- Relación con overlay (si ya se publicó)
    overlay_id      UUID            NULL,

    status          VARCHAR(20)     NOT NULL DEFAULT 'DRAFT'
                    CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),

    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (overlay_id) REFERENCES overlays(id) ON DELETE SET NULL
);

CREATE INDEX idx_canvas_creator ON canvas_drafts (creator_id);
CREATE INDEX idx_canvas_status  ON canvas_drafts (status);


-- ============================================================
-- MÓDULO 5 (cont.) — INTERACCIONES CON SpiderIA
-- ============================================================

CREATE TABLE ia_sessions (
    id           UUID        PRIMARY KEY DEFAULT UUID(),
    user_id      UUID        NOT NULL,
    draft_id     UUID        NULL,
    model_id     VARCHAR(100) NOT NULL,
    messages     JSON        NOT NULL,                                    -- historial completo de mensajes
    created_at   TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (draft_id) REFERENCES canvas_drafts(id) ON DELETE SET NULL
);

CREATE INDEX idx_ia_sessions_user  ON ia_sessions (user_id);
CREATE INDEX idx_ia_sessions_draft ON ia_sessions (draft_id);


-- ============================================================
-- MÓDULO 7 — ADMIN DASHBOARD
-- ============================================================

CREATE TABLE admin_audit_log (
    id           UUID            PRIMARY KEY DEFAULT UUID(),
    admin_id     UUID            NOT NULL,
    action       VARCHAR(100)    NOT NULL,                                -- 'APPROVE_OVERLAY', 'BAN_USER', etc.
    entity_type  VARCHAR(50)     NOT NULL,                                -- 'overlay', 'user', 'purchase', etc.
    entity_id    UUID            NOT NULL,
    detail       JSON,                                                    -- datos adicionales / diff del cambio
    ip_address   VARCHAR(45),
    created_at   TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE RESTRICT
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
    ROUND(AVG(r.rating), 2)  AS avg_rating,
    COUNT(r.id)              AS review_count,
    COUNT(f.user_id)         AS favorite_count
FROM overlays o
LEFT JOIN reviews  r ON r.overlay_id = o.id
LEFT JOIN favorites f ON f.overlay_id = o.id
GROUP BY o.id, o.name, o.slug, o.price, o.status, o.creator_id, o.tags, o.preview_storage_ids, o.is_featured, o.view_count, o.download_count, o.published_at;

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
GROUP BY b.id, b.name, b.description, b.visibility, b.cover_storage_id, b.created_at, b.owner_id, u.username, u.avatar_storage_id;


-- ============================================================
-- FK diferida: reviews → purchases (evita dependencia circular)
-- ============================================================
ALTER TABLE reviews
    ADD CONSTRAINT fk_reviews_purchase
    FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE RESTRICT;

-- ============================================================
-- FIN DEL SCRIPT
-- ============================================================
