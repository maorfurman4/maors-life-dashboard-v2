create table if not exists meal_plan_templates (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  diet_type   text,
  plan_data   jsonb not null,
  created_at  timestamptz not null default now()
);

alter table meal_plan_templates enable row level security;

create policy "Users manage own templates"
  on meal_plan_templates
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index meal_plan_templates_user_id_idx on meal_plan_templates(user_id);
