CREATE TABLE accounts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  secret VARCHAR(64) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_accounts_secret ON accounts (secret);

ALTER TABLE categories
  ADD COLUMN account_id INTEGER REFERENCES accounts (id) ON DELETE CASCADE;

ALTER TABLE transactions
  ADD COLUMN account_id INTEGER REFERENCES accounts (id) ON DELETE CASCADE;

DO $$
DECLARE
  default_account_id INTEGER;
BEGIN
  IF EXISTS (SELECT 1 FROM categories) OR EXISTS (SELECT 1 FROM transactions) THEN
    INSERT INTO accounts (name, secret)
    VALUES (
      'Default',
      replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '')
    )
    RETURNING id INTO default_account_id;

    UPDATE categories
    SET account_id = default_account_id
    WHERE account_id IS NULL;

    UPDATE transactions
    SET account_id = default_account_id
    WHERE account_id IS NULL;
  END IF;
END $$;

ALTER TABLE categories
  ALTER COLUMN account_id SET NOT NULL;

ALTER TABLE transactions
  ALTER COLUMN account_id SET NOT NULL;

CREATE INDEX idx_categories_account_id ON categories (account_id);
CREATE INDEX idx_transactions_account_id ON transactions (account_id);
