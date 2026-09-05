-- Alguns perfis criados antes do trigger atual ficaram com "name" vazio.
-- Preenche a partir do metadado salvo no cadastro, quando existir. Não
-- sobrescreve nomes já preenchidos.
update public.profiles p
set name = u.raw_user_meta_data->>'name'
from auth.users u
where p.id = u.id
  and (p.name is null or btrim(p.name) = '')
  and coalesce(u.raw_user_meta_data->>'name', '') <> '';
