-- Delete the 3 test vehicles with "---" format and "$NaN" purchase prices
DELETE FROM public.vehicles 
WHERE id IN (
  '6dad10dd-e4a4-4958-8ccd-39c4da5bba30',
  'a97a6217-8d17-4f0b-bf02-c34fe01513b5',
  '7ad057d0-64ce-45fb-892c-b51afeb1aeaf'
);