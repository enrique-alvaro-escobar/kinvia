CREATE TABLE usuarios (
  id            SERIAL PRIMARY KEY,
  nombre        VARCHAR(100)        NOT NULL,
  email         VARCHAR(150) UNIQUE NOT NULL,
  password_hash TEXT                NOT NULL,
  avatar_url    TEXT,
  created_at    TIMESTAMP           DEFAULT NOW()
);
-- Grupos familiares
CREATE TABLE grupos (
  id          SERIAL PRIMARY KEY,
  nombre      VARCHAR(150) NOT NULL,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Relación usuarios ↔ grupos (un usuario puede estar en un grupo)
CREATE TABLE usuarios_grupos (
  id          SERIAL PRIMARY KEY,
  usuario_id  INT REFERENCES usuarios(id) ON DELETE CASCADE,
  grupo_id    INT REFERENCES grupos(id) ON DELETE CASCADE,
  rol         VARCHAR(20) DEFAULT 'miembro', -- miembro, admin
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Tareas (pertenecen al grupo, se asignan a un usuario)
CREATE TABLE tareas (
  id              SERIAL PRIMARY KEY,
  titulo          VARCHAR(200) NOT NULL,
  descripcion     TEXT,
  fecha           DATE,
  estado          VARCHAR(20) DEFAULT 'pendiente', -- pendiente, en_curso, completada
  grupo_id        INT REFERENCES grupos(id) ON DELETE CASCADE,
  asignado_a      INT REFERENCES usuarios(id), -- usuario responsable
  creado_por      INT REFERENCES usuarios(id),
  created_at      TIMESTAMP DEFAULT NOW()
);

-- Eventos (pertenecen al grupo)
CREATE TABLE eventos (
  id          SERIAL PRIMARY KEY,
  titulo      VARCHAR(200) NOT NULL,
  descripcion TEXT,
  fecha_hora  TIMESTAMP NOT NULL,
  etiqueta    VARCHAR(100),
  grupo_id    INT REFERENCES grupos(id) ON DELETE CASCADE,
  creado_por  INT REFERENCES usuarios(id),
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Notas (pertenecen al grupo)
CREATE TABLE notas (
  id          SERIAL PRIMARY KEY,
  contenido   TEXT NOT NULL,
  grupo_id    INT REFERENCES grupos(id) ON DELETE CASCADE,
  creado_por  INT REFERENCES usuarios(id),
  created_at  TIMESTAMP DEFAULT NOW()
);