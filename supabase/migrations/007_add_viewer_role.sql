DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typnamespace = 'public'::regnamespace
      AND typname = 'sangpo_user_role'
  ) THEN
    BEGIN
      ALTER TYPE public.sangpo_user_role ADD VALUE IF NOT EXISTS 'viewer';
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;
