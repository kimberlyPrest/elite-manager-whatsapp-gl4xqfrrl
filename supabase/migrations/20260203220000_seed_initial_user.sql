-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Function to seed initial user safely
DO $$
DECLARE
  user_id uuid := gen_random_uuid();
  user_email text := 'admin@elitemanager.com';
  user_password text := 'admin123';
  encrypted_pw text;
BEGIN
  -- Check if user already exists to avoid duplicates
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = user_email) THEN
    -- Generate encrypted password
    encrypted_pw := crypt(user_password, gen_salt('bf'));

    -- Insert into auth.users
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      user_id,
      'authenticated',
      'authenticated',
      user_email,
      encrypted_pw,
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    );

    -- Insert into auth.identities (Required for Supabase Auth to recognize the identity)
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      user_id,
      user_id,
      format('{"sub":"%s","email":"%s"}', user_id::text, user_email)::jsonb,
      'email',
      NOW(),
      NOW(),
      NOW()
    );
    
  END IF;
END $$;
