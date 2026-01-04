-- Create jobs table
create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null check (status in ('queued','processing','complete','failed')) default 'queued',
  style text,
  constraints jsonb,
  analysis jsonb,
  input_image_path text not null,
  output_image_paths text[] default '{}',
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- trigger to auto-update updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_set_updated_at on public.jobs;
create trigger trg_set_updated_at
before update on public.jobs
for each row execute function public.set_updated_at();

-- Create private storage buckets
insert into storage.buckets (id, name, public) values ('room_inputs','room_inputs', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public) values ('room_outputs','room_outputs', false)
on conflict (id) do nothing;

