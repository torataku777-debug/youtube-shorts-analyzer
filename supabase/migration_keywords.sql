-- Create trending_keywords table
create table if not exists trending_keywords (
  id uuid primary key default uuid_generate_v4(),
  keyword text not null,
  region text not null,
  frequency integer default 1,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  -- Ensure unique keyword per region
  unique(keyword, region)
);

-- Index for fast retrieval
create index if not exists idx_trending_keywords_region_frequency on trending_keywords(region, frequency desc);

-- Trigger to update updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language 'plpgsql';

create trigger update_trending_keywords_updated_at
before update on trending_keywords
for each row
execute procedure update_updated_at_column();
