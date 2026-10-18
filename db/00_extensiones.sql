-- La búsqueda sin tildes (documents.py → func.unaccent) necesita esta extensión.
-- En Supabase existe en el schema "extensions", por eso pg_dump de "public" no la incluyó.

CREATE EXTENSION IF NOT EXISTS unaccent;