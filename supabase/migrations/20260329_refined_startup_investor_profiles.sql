-- Migration: Update tables with refined schema and constraints
-- Date: 2026-03-29
-- Description: Update startup_profiles and investor_profiles with NOT NULL constraints and proper field names

-- Create enum types
CREATE TYPE user_type_enum AS ENUM ('STARTUP', 'INVESTOR');
CREATE TYPE startup_stage_enum AS ENUM ('IDEA', 'MVP', 'EARLY_REVENUE', 'GROWTH', 'SCALING');
CREATE TYPE funding_stage_enum AS ENUM ('PRE_SEED', 'SEED', 'SERIES_A', 'SERIES_B', 'SERIES_C', 'SERIES_D_PLUS');
CREATE TYPE revenue_status_enum AS ENUM ('PRE_REVENUE', 'REVENUE_GENERATING', 'PROFITABLE');
CREATE TYPE investor_type_enum AS ENUM ('ANGEL', 'VC_FIRM', 'CORPORATE_VC', 'FAMILY_OFFICE', 'ACCELERATOR', 'INCUBATOR', 'PRIVATE_EQUITY');
CREATE TYPE connection_status_enum AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'REMOVED');
CREATE TYPE notification_type_enum AS ENUM ('CONNECTION_REQUEST', 'CONNECTION_ACCEPTED', 'CONNECTION_DECLINED', 'NEW_MESSAGE', 'PROFILE_VIEW', 'SYSTEM_ANNOUNCEMENT', 'WEEKLY_DIGEST');
CREATE TYPE privacy_level_enum AS ENUM ('PUBLIC', 'CONNECTIONS_ONLY', 'PRIVATE');
CREATE TYPE document_type_enum AS ENUM ('PITCH_DECK', 'BUSINESS_PLAN', 'LOGO', 'TEAM_PHOTO', 'PROFILE_PHOTO');
CREATE TYPE report_status_enum AS ENUM ('PENDING', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED');
CREATE TYPE request_status_enum AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- Drop existing tables in correct order
DROP TABLE IF EXISTS public.startup_profiles CASCADE;
DROP TABLE IF EXISTS public.investor_profiles CASCADE;

-- Create refined startup_profiles table
CREATE TABLE IF NOT EXISTS public.startup_profiles (
    startup_profile_id UUID NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Business Info - All Required
    company_name VARCHAR(255) NOT NULL,
    founder_names TEXT NOT NULL,
    tagline VARCHAR(150) NOT NULL,
    detailed_description TEXT NOT NULL,
    industry VARCHAR(100) NOT NULL,
    founded_date DATE NOT NULL,
    current_stage startup_stage_enum NOT NULL,
    
    -- Team - Required
    team_size INT NOT NULL,
    key_team_members TEXT,
    team_photo_url VARCHAR(500),
    
    -- Funding - All Required
    funding_stage funding_stage_enum NOT NULL,
    amount_seeking DECIMAL(15, 2) NOT NULL,
    previous_funding DECIMAL(15, 2) DEFAULT 0,
    use_of_funds TEXT NOT NULL,
    revenue_status revenue_status_enum NOT NULL,
    
    -- Traction
    key_metrics TEXT,
    major_achievements TEXT,
    customer_testimonials TEXT,
    
    -- Documents
    pitch_deck_url VARCHAR(500),
    business_plan_url VARCHAR(500),
    product_demo_url VARCHAR(500),
    
    -- Contact - Required
    primary_contact_name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    social_media_links JSONB,
    
    -- Timestamps
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT startup_profiles_pkey PRIMARY KEY (startup_profile_id),
    CONSTRAINT chk_amount_seeking CHECK (amount_seeking > 0),
    CONSTRAINT chk_previous_funding CHECK (previous_funding >= 0),
    CONSTRAINT chk_team_size CHECK (team_size > 0)
);

-- Create refined investor_profiles table
CREATE TABLE IF NOT EXISTS public.investor_profiles (
    investor_profile_id UUID NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    
    -- Profile Info - Required
    name_or_firm VARCHAR(255) NOT NULL,
    investor_type investor_type_enum NOT NULL,
    years_of_experience INT NOT NULL,
    professional_background TEXT NOT NULL,
    investment_thesis TEXT NOT NULL,
    
    -- Investment Focus - Required
    industries_of_interest JSONB NOT NULL,
    geographic_preference JSONB NOT NULL,
    stage_preference JSONB NOT NULL,
    
    -- Investment Details - Required
    min_investment_size DECIMAL(15, 2) NOT NULL,
    max_investment_size DECIMAL(15, 2) NOT NULL,
    investment_structure JSONB NOT NULL,
    follow_on_investment BOOLEAN NOT NULL,
    investment_timeline VARCHAR(100) NOT NULL,
    
    -- Portfolio & Track Record
    number_of_investments INT DEFAULT 0,
    portfolio_companies TEXT,
    successful_exits TEXT,
    notable_achievements TEXT,
    
    -- Investment Criteria - Required
    what_you_look_for TEXT NOT NULL,
    deal_breakers TEXT,
    value_add TEXT NOT NULL,
    network_resources TEXT,
    
    -- Contact Information - Required
    primary_contact_email VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    social_media JSONB,
    preferred_contact_method VARCHAR(50) NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT investor_profiles_pkey PRIMARY KEY (investor_profile_id),
    CONSTRAINT fk_investor_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_years_experience CHECK (years_of_experience >= 0),
    CONSTRAINT chk_investment_size CHECK (min_investment_size <= max_investment_size),
    CONSTRAINT chk_min_investment CHECK (min_investment_size > 0),
    CONSTRAINT chk_number_investments CHECK (number_of_investments >= 0)
);

-- Create indexes for startup_profiles
CREATE INDEX IF NOT EXISTS idx_startup_profiles_user_id ON public.startup_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_startup_profiles_industry ON public.startup_profiles(industry);
CREATE INDEX IF NOT EXISTS idx_startup_profiles_current_stage ON public.startup_profiles(current_stage);
CREATE INDEX IF NOT EXISTS idx_startup_profiles_funding_stage ON public.startup_profiles(funding_stage);
CREATE INDEX IF NOT EXISTS idx_startup_profiles_revenue_status ON public.startup_profiles(revenue_status);
CREATE INDEX IF NOT EXISTS idx_startup_profiles_amount_seeking ON public.startup_profiles(amount_seeking);
CREATE INDEX IF NOT EXISTS idx_startup_profiles_created_at ON public.startup_profiles(created_at DESC);

-- Create indexes for investor_profiles
CREATE INDEX IF NOT EXISTS idx_investor_profiles_user_id ON public.investor_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_investor_profiles_investor_type ON public.investor_profiles(investor_type);
CREATE INDEX IF NOT EXISTS idx_investor_profiles_years_exp ON public.investor_profiles(years_of_experience);
CREATE INDEX IF NOT EXISTS idx_investor_profiles_investment_size ON public.investor_profiles(min_investment_size, max_investment_size);
CREATE INDEX IF NOT EXISTS idx_investor_profiles_industries ON public.investor_profiles USING gin(industries_of_interest);
CREATE INDEX IF NOT EXISTS idx_investor_profiles_stage ON public.investor_profiles USING gin(stage_preference);
CREATE INDEX IF NOT EXISTS idx_investor_profiles_created_at ON public.investor_profiles(created_at DESC);
