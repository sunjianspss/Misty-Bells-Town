create extension if not exists pgcrypto;

create table if not exists public.bridge_traces (
  id uuid primary key default gen_random_uuid(),
  message text not null check (char_length(trim(message)) between 2 and 28),
  ribbon_color text not null check (ribbon_color in ('晴蓝', '米白', '杏黄', '苔绿', '晚霞粉')),
  weather_tag text not null check (weather_tag in ('薄雾', '晴和有风', '风更明显了', '细雨', '雨后初晴', '晴朗，晚风将近', '晴暖有风')),
  story_day integer not null check (story_day between 5 and 7),
  visitor_id text not null check (char_length(visitor_id) between 8 and 72),
  author_label text not null default '桥边来客' check (char_length(author_label) between 2 and 24),
  is_visible boolean not null default true,
  source text not null default 'misty-bells-web',
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists bridge_traces_created_at_idx on public.bridge_traces (created_at desc);
create index if not exists bridge_traces_visible_idx on public.bridge_traces (is_visible, created_at desc);

alter table public.bridge_traces enable row level security;

grant select, insert on table public.bridge_traces to anon;

drop policy if exists "bridge traces are readable" on public.bridge_traces;
create policy "bridge traces are readable"
on public.bridge_traces
for select
to anon
using (is_visible = true);

drop policy if exists "bridge traces are insertable" on public.bridge_traces;
create policy "bridge traces are insertable"
on public.bridge_traces
for insert
to anon
with check (
  is_visible = true
  and char_length(trim(message)) between 2 and 28
  and ribbon_color in ('晴蓝', '米白', '杏黄', '苔绿', '晚霞粉')
  and weather_tag in ('薄雾', '晴和有风', '风更明显了', '细雨', '雨后初晴', '晴朗，晚风将近', '晴暖有风')
  and story_day between 5 and 7
);

do $$
begin
  alter publication supabase_realtime add table public.bridge_traces;
exception
  when duplicate_object then null;
end
$$;
