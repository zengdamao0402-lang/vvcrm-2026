-- Migration: Add country_distribution RPC function
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION public.country_distribution()
RETURNS TABLE (country TEXT, count BIGINT)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT destination_country AS country, COUNT(*)::BIGINT AS count
  FROM public.leads
  WHERE destination_country IS NOT NULL
    AND destination_country != '' 
    AND stage != 'Lost'
  GROUP BY destination_country
  ORDER BY count DESC
  LIMIT 10;
$$;
