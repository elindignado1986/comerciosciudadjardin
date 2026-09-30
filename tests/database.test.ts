import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { postgis } from "@electric-sql/pglite-postgis";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";

test("Migraciones, PostGIS, RLS, aprobación atómica, historial y QR permanente", async (t) => {
  const db = new PGlite({ extensions: { postgis, pgcrypto } });
  await db.exec(`
  create role anon; create role authenticated; create role service_role bypassrls;
  create schema auth; create table auth.users(id uuid primary key);
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
  grant usage on schema public,auth to anon,authenticated,service_role;
  create schema storage;
  create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
  create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
  alter table storage.objects enable row level security;
  alter default privileges in schema public grant all on tables to anon,authenticated,service_role;
  alter default privileges in schema public grant all on sequences to anon,authenticated,service_role;
 `);
  for (const file of (await fs.readdir("supabase/migrations"))
    .filter((f) => f.endsWith(".sql"))
    .sort())
    await db.exec(await fs.readFile(`supabase/migrations/${file}`, "utf8"));
  const admin = "10000000-0000-4000-8000-000000000001",
    outsider = "20000000-0000-4000-8000-000000000002";
  await db.query("insert into auth.users values ($1),($2)", [admin, outsider]);
  await db.query("insert into admin_users(user_id) values($1)", [admin]);
  const values = `('Prueba aislada','Wernicke 2236','AV WERNICKE 2236',-34.592576043142856,-58.590959175959185,'Servicios','ADHERIDO')`;
  const cols =
    "(name,address_input,address_normalized,lat,lng,category,adhesion)";
  await t.test(
    "fuera del límite no se guarda ni con service role",
    async () => {
      await db.exec("set role service_role");
      await assert.rejects(
        db.exec(
          `insert into business_submissions ${cols} values ('Fuera','CABA','CABA',-34.6037,-58.3816,'Servicios','ADHERIDO')`,
        ),
        /fuera de Ciudad Jardín/,
      );
      await db.exec("reset role");
    },
  );
  await t.test("anónimo no lee evidencia ni inserta directamente", async () => {
    await db.exec("set role anon");
    assert.equal(
      (await db.query("select * from public_businesses")).rows.length,
      0,
    );
    await assert.rejects(
      db.query("select * from business_submissions"),
      /permission denied/,
    );
    await assert.rejects(
      db.exec(`insert into business_submissions ${cols} values ${values}`),
      /permission denied/,
    );
    await assert.rejects(
      db.query("select approve_submission(gen_random_uuid())"),
      /permission denied/,
    );
    await db.exec("reset role");
  });
  await db.exec(
    `set role service_role;insert into business_submissions ${cols} values ${values};reset role;`,
  );
  const submission = (
    await db.query<{ id: string }>("select id from business_submissions")
  ).rows[0].id;
  await t.test(
    "usuario Google ajeno a admin_users no puede revisar",
    async () => {
      await db.exec(
        `set role authenticated;set request.jwt.claim.sub='${outsider}'`,
      );
      assert.equal(
        (await db.query("select * from business_submissions")).rows.length,
        0,
      );
      await assert.rejects(
        db.query("select approve_submission($1)", [submission]),
        /Forbidden/,
      );
      await assert.rejects(
        db.exec(`insert into businesses ${cols} values ${values}`),
        /Forbidden|row-level security/,
      );
      await db.exec("reset role");
    },
  );
  let business = "";
  await t.test(
    "administrador aprueba una sola vez y genera CJ-0001",
    async () => {
      await db.exec(
        `set role authenticated;set request.jwt.claim.sub='${admin}'`,
      );
      business = (
        await db.query<{ id: string }>("select approve_submission($1) as id", [
          submission,
        ])
      ).rows[0].id;
      const b = (
        await db.query<{ code: string }>(
          "select code from businesses where id=$1",
          [business],
        )
      ).rows[0];
      assert.equal(b.code, "CJ-0001");
      await assert.rejects(
        db.query("select approve_submission($1)", [submission]),
        /ya fue revisada/,
      );
      assert.equal((await db.query("select * from businesses")).rows.length, 1);
      await assert.rejects(
        db.query("update businesses set lat=-34.60,lng=-58.38 where id=$1", [
          business,
        ]),
        /fuera de Ciudad Jardín/,
      );
      await db.exec("reset role");
    },
  );
  await t.test("la proyección pública excluye datos privados", async () => {
    await db.exec("set role anon");
    const row = (
      await db.query<Record<string, unknown>>("select * from public_businesses")
    ).rows[0];
    assert.equal(row.code, "CJ-0001");
    for (const col of [
      "photo_path",
      "evidence",
      "sender_email",
      "sender_name",
      "geocoder_source",
    ])
      assert.equal(col in row, false);
    await db.exec("reset role");
  });
  await t.test(
    "suspensión/revocación conserva identidad y auditoría",
    async () => {
      await db.exec(
        `set role authenticated;set request.jwt.claim.sub='${admin}'`,
      );
      await db.query(
        "update businesses set qr_status='SUSPENDED' where id=$1",
        [business],
      );
      await db.query("update businesses set qr_status='REVOKED' where id=$1", [
        business,
      ]);
      await assert.rejects(
        db.query("update businesses set qr_status='ACTIVE' where id=$1", [
          business,
        ]),
        /no puede reactivarse/,
      );
      await assert.rejects(
        db.query("update businesses set code='CJ-0009' where id=$1", [
          business,
        ]),
        /permanentes/,
      );
      const audit = await db.query<{ action: string; actor: string }>(
        "select action,actor from business_history where entity_id=$1",
        [business],
      );
      assert.ok(
        audit.rows.some((r) => r.action === "QR_REVOKED" && r.actor === admin),
      );
      await db.query("update businesses set deleted_at=now() where id=$1", [
        business,
      ]);
      const next = await db.query<{ code: string }>(
        `insert into businesses ${cols} values ${values} returning code`,
      );
      assert.equal(next.rows[0].code, "CJ-0002");
      await db.exec("reset role");
    },
  );
  await t.test("contador persistente rechaza exceso", async () => {
    await db.exec("set role service_role");
    assert.equal(
      (
        await db.query<{ ok: boolean }>(
          "select consume_rate_limit('test',1,600) as ok",
        )
      ).rows[0].ok,
      true,
    );
    assert.equal(
      (
        await db.query<{ ok: boolean }>(
          "select consume_rate_limit('test',1,600) as ok",
        )
      ).rows[0].ok,
      false,
    );
    await db.exec("reset role");
  });
  await db.close();
});
