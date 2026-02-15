-- Create rate_limits table
CREATE TABLE IF NOT EXISTS rate_limits (
    key TEXT PRIMARY KEY, -- ip:route or wallet:route
    count INT DEFAULT 1,
    window_start TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for cleanup (optional, but good for expiring old rows)
CREATE INDEX IF NOT EXISTS rate_limits_window_start_idx ON rate_limits (window_start);

-- RPC function for atomic rate limiting
create or replace function check_rate_limit(
  identify_key text,
  window_limit int,
  window_seconds int
)
returns table (
  allowed boolean,
  remaining int,
  reset_time timestamptz
)
language plpgsql
as $$
declare
  curr_count int;
  curr_window_start timestamptz;
  now_time timestamptz := now();
  expires_at timestamptz;
  is_expired boolean;
begin
  -- Try to get existing record
  select count, window_start into curr_count, curr_window_start
  from rate_limits
  where key = identify_key;

  -- Verify if window expired
  if curr_window_start is null then
     is_expired := true;
  else
     is_expired := (now_time > (curr_window_start + (window_seconds || ' seconds')::interval));
  end if;

  if curr_window_start is null or is_expired then
    -- New window or first time
    insert into rate_limits (key, count, window_start, updated_at)
    values (identify_key, 1, now_time, now_time)
    on conflict (key) do update
    set count = 1, window_start = EXCLUDED.window_start, updated_at = EXCLUDED.updated_at;
    
    return query select true, window_limit - 1, (now_time + (window_seconds || ' seconds')::interval);
  else
    -- Existing window, increment
    if curr_count >= window_limit then
       return query select false, 0, (curr_window_start + (window_seconds || ' seconds')::interval);
    else
       update rate_limits
       set count = count + 1, updated_at = now_time
       where key = identify_key;
       
       return query select true, window_limit - (curr_count + 1), (curr_window_start + (window_seconds || ' seconds')::interval);
    end if;
  end if;
end;
$$;
