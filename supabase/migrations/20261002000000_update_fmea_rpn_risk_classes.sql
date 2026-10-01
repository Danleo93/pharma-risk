-- Reclassify existing and future FMEA risks without changing their scores.
begin;

alter table public.risk_items drop column risk_class;

alter table public.risk_items add column risk_class text generated always as (
  case
    when severity is null or probability is null or detectability is null then null
    when severity * probability * detectability >= 40 then 'Alta'
    when severity * probability * detectability >= 20 then 'Media'
    else 'Bassa'
  end
) stored;

commit;
