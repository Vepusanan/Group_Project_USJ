CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token VARCHAR(512) NOT NULL UNIQUE,
    is_remembered BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    client_ip VARCHAR(45) -- Stores IP address for session security
);


-- updated again
ALTER TABLE sessions
ADD COLUMN device_info VARCHAR(255); -- e.g., 'Chrome 110 on Windows 10'