CREATE TABLE permissions (
                             id SERIAL PRIMARY KEY,
                             api_key TEXT NOT NULL,
                             module TEXT NOT NULL,
                             action TEXT NOT NULL,
                             UNIQUE (api_key, module, action)
);