create extension if not exists postgis;
create extension if not exists pgcrypto;
create table public.admin_users (user_id uuid primary key references auth.users(id) on delete cascade, created_at timestamptz not null default now());
create function public.is_admin() returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from admin_users where user_id=auth.uid()) $$;
create table public.app_boundary (id int primary key check(id=1), geom geometry(Geometry,4326) not null check(st_isvalid(geom) and geometrytype(geom) in ('POLYGON','MULTIPOLYGON')));
create table public.business_categories (name text primary key);
insert into public.business_categories values ('Gastronomía'),('Alimentos'),('Indumentaria'),('Salud'),('Servicios'),('Educación'),('Profesionales'),('Otros');
create sequence public.business_code_seq;
create table public.businesses (
 id uuid primary key default gen_random_uuid(), code text not null unique,
 name text not null check(length(name) between 2 and 140), address_input text not null, address_normalized text not null,
 lat double precision not null, lng double precision not null, category text not null references business_categories(name),
 adhesion text not null check(adhesion in ('ADHERIDO','SIN_ADHESION')), qr_status text not null default 'ACTIVE' check(qr_status in ('ACTIVE','SUSPENDED','REVOKED')),
 adhesion_date date, geocoder_source text not null default 'manual', geocoder_confidence double precision, manually_adjusted boolean not null default false,
 evidence text, photo_path text, deleted_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.business_submissions (
 id uuid primary key default gen_random_uuid(), name text not null check(length(name) between 2 and 140), address_input text not null, address_normalized text not null,
 lat double precision not null, lng double precision not null, category text not null references business_categories(name), adhesion text not null check(adhesion in ('ADHERIDO','SIN_ADHESION')),
 geocoder_source text not null default 'manual', geocoder_confidence double precision, manually_adjusted boolean not null default false,
 comment text, evidence text, photo_path text, sender_name text, sender_email text, terms_accepted_at timestamptz not null default now(),
 status text not null default 'PENDING' check(status in ('PENDING','APPROVED','REJECTED')), business_id uuid references businesses(id),
 reviewed_by uuid references auth.users(id), reviewed_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.business_reports (
 id uuid primary key default gen_random_uuid(), business_id uuid not null references businesses(id),
 type text not null check(type in ('CLOSED','RENAMED','WRONG_ADDRESS','WRONG_LOCATION','WRONG_STATUS','FAKE_OR_MISPLACED_QR','OTHER')),
 comment text check(length(comment)<=3000), status text not null default 'OPEN' check(status in ('OPEN','RESOLVED')), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.business_history (
 id uuid primary key default gen_random_uuid(), timestamp timestamptz not null default now(), action text not null, actor uuid,
 entity text not null, entity_id uuid not null, old_values jsonb, new_values jsonb, metadata jsonb not null default '{}'
);
create table public.qr_codes (
 id uuid primary key default gen_random_uuid(), business_id uuid not null unique references businesses(id), path text not null unique, filename text not null unique, url text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.rate_limits (key text primary key, hits int not null, expires_at timestamptz not null);
create index businesses_location_idx on businesses using gist (st_setsrid(st_makepoint(lng,lat),4326));
create index businesses_filters_idx on businesses (adhesion,category) where deleted_at is null;
create index submissions_status_idx on business_submissions(status,created_at desc);
create index reports_status_idx on business_reports(status,created_at desc);
create index history_entity_idx on business_history(entity_id,timestamp desc);
create function public.check_location() returns trigger language plpgsql security definer set search_path=public as $$
begin
 if new.lat not between -90 and 90 or new.lng not between -180 and 180 or not exists(select 1 from app_boundary where st_covers(geom,st_setsrid(st_makepoint(new.lng,new.lat),4326))) then
  raise exception 'Esta ubicación está fuera de Ciudad Jardín.';
 end if;
 return new;
end $$;
create function public.touch_updated() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
create function public.audit_change() returns trigger language plpgsql security definer set search_path=public as $$
declare action_name text; before_value jsonb; after_value jsonb;
begin
 before_value=case when TG_OP='INSERT' then null else to_jsonb(old) end;
 after_value=to_jsonb(new);
 action_name=case when TG_OP='INSERT' then 'CREATED' else 'EDITED' end;
 if TG_TABLE_NAME='business_submissions' then
  action_name=case when TG_OP='INSERT' then 'PROPOSED' when old.status is distinct from new.status then new.status else 'EDITED' end;
 elsif TG_TABLE_NAME='business_reports' then action_name=case when TG_OP='INSERT' then 'REPORTED' else 'REPORT_RESOLVED' end;
 elsif TG_TABLE_NAME='qr_codes' then action_name='QR_GENERATED';
 elsif TG_TABLE_NAME='businesses' and TG_OP='UPDATE' then
  action_name=case when old.deleted_at is null and new.deleted_at is not null then 'SOFT_DELETED' when old.qr_status is distinct from new.qr_status then 'QR_'||new.qr_status when old.lat<>new.lat or old.lng<>new.lng then 'LOCATION_CHANGED' when old.adhesion<>new.adhesion then 'ADHESION_CHANGED' when old.name<>new.name then 'NAME_CHANGED' else 'EDITED' end;
 end if;
 insert into business_history(action,actor,entity,entity_id,old_values,new_values) values(action_name,auth.uid(),TG_TABLE_NAME,new.id,before_value,after_value);
 return new;
end $$;
create trigger businesses_geo before insert or update on businesses for each row execute function check_location();
create trigger submissions_geo before insert or update on business_submissions for each row execute function check_location();
create function public.assign_business_code() returns trigger language plpgsql security definer set search_path=public as $$
declare number_text text;
begin
 if not is_admin() then raise exception 'Forbidden'; end if;
 number_text=nextval('public.business_code_seq')::text;
 new.code='CJ-' || lpad(number_text,greatest(4,length(number_text)),'0');
 return new;
end $$;
create trigger businesses_code before insert on businesses for each row execute function assign_business_code();
create function public.protect_business_identity() returns trigger language plpgsql as $$
begin
 if new.code is distinct from old.code or new.id is distinct from old.id then raise exception 'El código y UUID son permanentes'; end if;
 if old.qr_status='REVOKED' and new.qr_status<>'REVOKED' then raise exception 'Una placa revocada no puede reactivarse'; end if;
 return new;
end $$;
create trigger permanent_identity before update on businesses for each row execute function protect_business_identity();
do $$ declare t text; begin foreach t in array array['businesses','business_submissions','business_reports','qr_codes'] loop
 execute format('create trigger touch before update on %I for each row execute function touch_updated()',t);
 execute format('create trigger audit after insert or update on %I for each row execute function audit_change()',t);
end loop; end $$;
-- Public projection deliberately excludes private columns, not merely rows.
create view public.public_businesses with (security_barrier=true) as
 select id,code,name,address_normalized,lat,lng,category,adhesion,qr_status,adhesion_date from businesses where deleted_at is null;
grant select on public.public_businesses to anon,authenticated;
alter table admin_users enable row level security;
create policy admin_self on admin_users for select to authenticated using (user_id=auth.uid());
alter table app_boundary enable row level security;
alter table rate_limits enable row level security;
alter table business_categories enable row level security;
create policy categories_read on business_categories for select using(true);
do $$ declare t text; begin foreach t in array array['businesses','business_submissions','business_reports','qr_codes'] loop
 execute format('alter table %I enable row level security',t);
 execute format('create policy admin_read on %I for select to authenticated using(public.is_admin())',t);
 execute format('create policy admin_insert on %I for insert to authenticated with check(public.is_admin())',t);
 execute format('create policy admin_update on %I for update to authenticated using(public.is_admin()) with check(public.is_admin())',t);
end loop; end $$;
alter table business_history enable row level security;
create policy history_admin_read on business_history for select to authenticated using(public.is_admin());
-- Anonymous writes go only through server endpoints after CAPTCHA and rate limiting.
revoke all on public.businesses,public.business_submissions,public.business_reports,public.qr_codes,public.business_history,public.admin_users,public.rate_limits,public.app_boundary from anon;
grant select,insert,update on businesses,business_submissions,business_reports,qr_codes to authenticated;
grant select on business_history,admin_users to authenticated;
revoke all on sequence business_code_seq from anon,authenticated;
create function public.approve_submission(submission_id uuid) returns uuid language plpgsql security definer set search_path=public as $$
declare s business_submissions; result uuid;
begin
 if not is_admin() then raise exception 'Forbidden'; end if;
 select * into s from business_submissions where id=submission_id for update;
 if not found or s.status<>'PENDING' then raise exception 'La propuesta ya fue revisada'; end if;
 insert into businesses(name,address_input,address_normalized,lat,lng,category,adhesion,adhesion_date,geocoder_source,geocoder_confidence,manually_adjusted,evidence,photo_path)
 values(s.name,s.address_input,s.address_normalized,s.lat,s.lng,s.category,s.adhesion,case when s.adhesion='ADHERIDO' then current_date else null end,s.geocoder_source,s.geocoder_confidence,s.manually_adjusted,s.evidence,s.photo_path) returning id into result;
 update business_submissions set status='APPROVED',business_id=result,reviewed_by=auth.uid(),reviewed_at=now() where id=s.id;
 return result;
end $$;
revoke all on function approve_submission(uuid) from public;
grant execute on function approve_submission(uuid) to authenticated;
create function public.consume_rate_limit(bucket_key text, max_hits int, window_seconds int) returns boolean language plpgsql security definer set search_path=public as $$
declare total int;
begin
 delete from rate_limits where expires_at < now() - interval '1 day';
 insert into rate_limits(key,hits,expires_at) values(bucket_key,1,now()+make_interval(secs=>window_seconds))
 on conflict(key) do update set hits=case when rate_limits.expires_at<now() then 1 else rate_limits.hits+1 end,
 expires_at=case when rate_limits.expires_at<now() then now()+make_interval(secs=>window_seconds) else rate_limits.expires_at end returning hits into total;
 return total<=max_hits;
end $$;
revoke all on function consume_rate_limit(text,int,int) from public;
grant execute on function consume_rate_limit(text,int,int) to service_role;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
 ('evidence','evidence',false,8388608,array['image/webp']),('qr-codes','qr-codes',false,2097152,array['image/png']) on conflict(id) do nothing;
create policy private_admin_read on storage.objects for select to authenticated using(bucket_id in ('evidence','qr-codes') and public.is_admin());
