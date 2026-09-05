-- Endereço completo do motorista (preenchido via CEP, como no formulário de
-- protocolo), campos adicionais de veículo (cor, ano — modelo já existe na
-- coluna "vehicle"), e preferências de notificação por motorista.
begin;

alter table public.drivers
  add column if not exists address_cep text,
  add column if not exists address_street text,
  add column if not exists address_number text,
  add column if not exists address_complement text,
  add column if not exists address_district text,
  add column if not exists address_state text,
  add column if not exists vehicle_color text,
  add column if not exists vehicle_year text,
  add column if not exists notify_email boolean not null default true,
  add column if not exists notify_sms boolean not null default true;

commit;
