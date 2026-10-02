-- Numri serial për pajisjet në lokacion
alter table public.deployed_devices
  add column if not exists serial_number text;

create index if not exists deployed_devices_serial_idx
  on public.deployed_devices (serial_number)
  where serial_number is not null;
