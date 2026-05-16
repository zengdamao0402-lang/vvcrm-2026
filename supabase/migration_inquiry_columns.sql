-- Migration: Add missing columns to inquiry_events table
-- Run this in Supabase SQL Editor

alter table public.inquiry_events add column if not exists company_cn text default '';
alter table public.inquiry_events add column if not exists company_en text default '';
alter table public.inquiry_events add column if not exists port text default '';
alter table public.inquiry_events add column if not exists vin text default '';
alter table public.inquiry_events add column if not exists trade_terms text default '';
alter table public.inquiry_events add column if not exists quantity text default '';
