-- +goose Up
CREATE TABLE IF NOT EXISTS app.users (
  ID UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  FirstName VARCHAR(50),
  Surname VARCHAR(50),
  Email VARCHAR(255) UNIQUE NOT NULL,
  PasswordHash VARCHAR(255) NOT NULL,
  CreatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UpdatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for email lookups
CREATE INDEX idx_users_email ON app.users(Email);

-- +goose Down
DROP TABLE IF EXISTS app.users;
