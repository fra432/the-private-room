-- Add drink preference and music taste to questionnaires
alter table public.questionnaires add column drink_preference text;
alter table public.questionnaires add column music_taste text;

-- Update insert policy to validate new columns
drop policy "users insert own questionnaire" on public.questionnaires;

create policy "users insert own questionnaire"
  on public.questionnaires for insert to authenticated
  with check (
    auth.uid() = user_id
    and length(trim(hair_type)) between 1 and 100
    and length(trim(hair_length)) between 1 and 100
    and length(trim(hair_color)) between 1 and 100
    and length(trim(goals)) between 1 and 2000
    and (treatments is null or length(treatments) <= 2000)
    and (allergies is null or length(allergies) <= 2000)
    and (inspiration is null or length(inspiration) <= 2000)
    and (additional is null or length(additional) <= 2000)
    and (drink_preference is null or length(trim(drink_preference)) between 1 and 50)
    and (music_taste is null or length(music_taste) <= 1000)
  );
