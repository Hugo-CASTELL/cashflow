CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  amount NUMERIC(15, 2) NOT NULL,
  date DATE NOT NULL,
  category_id INTEGER NOT NULL REFERENCES categories(id)
);
