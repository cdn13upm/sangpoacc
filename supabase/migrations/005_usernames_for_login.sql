ALTER TABLE public."Sangpo_User"
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS username TEXT;

UPDATE public."Sangpo_User" AS sangpo_user
SET email = auth_user.email
FROM auth.users AS auth_user
WHERE auth_user.id = sangpo_user.id
  AND (
    sangpo_user.email IS NULL
    OR sangpo_user.email <> auth_user.email
  );

WITH username_candidates AS (
  SELECT
    sangpo_user.id,
    COALESCE(
      NULLIF(
        LOWER(REGEXP_REPLACE(SPLIT_PART(COALESCE(sangpo_user.email, auth_user.email, ''), '@', 1), '[^a-z0-9]+', '_', 'g')),
        ''
      ),
      'user'
    ) AS base_username,
    ROW_NUMBER() OVER (
      PARTITION BY COALESCE(
        NULLIF(
          LOWER(REGEXP_REPLACE(SPLIT_PART(COALESCE(sangpo_user.email, auth_user.email, ''), '@', 1), '[^a-z0-9]+', '_', 'g')),
          ''
        ),
        'user'
      )
      ORDER BY auth_user.created_at NULLS LAST, sangpo_user.id
    ) AS username_rank
  FROM public."Sangpo_User" AS sangpo_user
  LEFT JOIN auth.users AS auth_user
    ON auth_user.id = sangpo_user.id
  WHERE sangpo_user.username IS NULL
)
UPDATE public."Sangpo_User" AS sangpo_user
SET username = CASE
  WHEN username_candidates.username_rank = 1 THEN username_candidates.base_username
  ELSE username_candidates.base_username || username_candidates.username_rank::TEXT
END
FROM username_candidates
WHERE sangpo_user.id = username_candidates.id
  AND sangpo_user.username IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "Sangpo_User_email_lower_key"
  ON public."Sangpo_User" (LOWER(email))
  WHERE email IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "Sangpo_User_username_lower_key"
  ON public."Sangpo_User" (LOWER(username))
  WHERE username IS NOT NULL;
