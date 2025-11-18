CREATE TABLE password_reset_tokens (
    token VARCHAR(255) PRIMARY KEY,               -- The unique reset token (can be a hashed or non-hashed string)
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- Link to the user who requested the reset
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL, -- Token validity period (e.g., 1 hour)
    used_at TIMESTAMP WITH TIME ZONE,             -- Timestamp when the token was successfully used (for one-time validation)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Optional: Add an index for faster lookups by user_id
CREATE INDEX idx_prt_user_id ON password_reset_tokens(user_id);


