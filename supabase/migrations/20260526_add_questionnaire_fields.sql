-- Add beverage preference and music taste to questionnaires
alter table public.questionnaires 
add column beverage_preference text check (beverage_preference in ('tea', 'coffee', 'no-preference')),
add column music_taste text;
