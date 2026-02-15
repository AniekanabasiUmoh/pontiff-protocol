-- Check debates table schema
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'debates' 
ORDER BY ordinal_position;

-- Check conversions table schema
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'conversions' 
ORDER BY ordinal_position;
