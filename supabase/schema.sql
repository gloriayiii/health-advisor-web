-- Supabase / PostgreSQL schema for Health Advisor
-- Enables pgcrypto for gen_random_uuid()
create extension if not exists pgcrypto;

-- Clinicians table
create table if not exists clinicians (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique,
  specialty text,
  phone text,
  metadata jsonb,
  created_at timestamptz default now()
);

-- Health plans table
create table if not exists healthplans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  provider text,
  coverage jsonb,
  metadata jsonb,
  created_at timestamptz default now()
);

-- Patients table
create table if not exists patients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique,
  dob date,
  gender text,
  phone text,
  address jsonb,
  clinician_id uuid references clinicians(id) on delete set null,
  healthplan_id uuid references healthplans(id) on delete set null,
  metadata jsonb,
  created_at timestamptz default now()
);

-- Indexes
create index if not exists idx_patients_email on patients(email);
create index if not exists idx_clinicians_email on clinicians(email);

-- Recommendations table: AI-generated or clinician-reviewed recommendations for patients
create table if not exists recommendations (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references patients(id) on delete cascade,
  clinician_id uuid references clinicians(id) on delete set null,
  original_prompt text,
  recommendation text,
  status text default 'pending',
  confidence numeric,
  generated_at timestamptz default now(),
  metadata jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_recommendations_patient on recommendations(patient_id);
