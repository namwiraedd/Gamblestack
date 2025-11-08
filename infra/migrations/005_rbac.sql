CREATE TABLE roles (
  id serial PRIMARY KEY,
  name text UNIQUE NOT NULL,
  description text
);
CREATE TABLE user_roles (
  user_id uuid REFERENCES users(id),
  role_id int REFERENCES roles(id),
  assigned_at timestamptz DEFAULT now(),
  PRIMARY KEY(user_id, role_id)
);
