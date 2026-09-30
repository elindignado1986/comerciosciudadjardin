"use client";
import Link from "next/link";

import { useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  Check,
  Heart,
  Leaf,
  MapPin,
  Plus,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from "lucide-react";
import Brand from "@/components/ui/Brand";
import MapLoader from "./MapLoader";
import AddressSearch from "./AddressSearch";
import { brand, categories } from "@/lib/config";
import type { PublicBusiness } from "@/lib/types";
export default function PublicMap() {
  const [businesses, setBusinesses] = useState<PublicBusiness[]>([]),
    [filter, setFilter] = useState("ALL"),
    [category, setCategory] = useState(""),
    [selected, setSelected] = useState<PublicBusiness | null>(null),
    [focus, setFocus] = useState<[number, number] | null>(null),
    [point, setPoint] = useState<[number, number] | null>(null),
    [notice, setNotice] = useState(""),
    [loaded, setLoaded] = useState(false);
  useEffect(() => {
    fetch("/api/businesses")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setNotice(d.error);
        setBusinesses(d.businesses || []);
        setLoaded(true);
        const code = new URLSearchParams(location.search).get("code");
        const b = d.businesses?.find((b: PublicBusiness) => b.code === code);
        if (b) {
          setSelected(b);
          setFocus([b.lng, b.lat]);
        }
      })
      .catch(() => {
        setNotice("No pudimos cargar los comercios. Volvé a intentarlo.");
        setLoaded(true);
      });
  }, []);
  const visible = businesses.filter(
    (b) =>
      (filter === "ALL" ||
        (filter === "ADHERIDO"
          ? b.adhesion === "ADHERIDO" && b.qr_status === "ACTIVE"
          : b.adhesion === "SIN_ADHESION" || b.qr_status !== "ACTIVE")) &&
      (!category || b.category === category),
  );
  return (
    <div className="home">
      <header className="site-header">
        <Brand />
        <nav>
          <Link href="/acerca" className="header-about">
            El proyecto <ArrowUpIcon />
          </Link>
          <Link href="/sumar" className="button button-dark">
            <Plus size={17} /> Sumar comercio
          </Link>
        </nav>
      </header>
      <main className="explorer">
        <aside className="explorer-panel">
          <div className="eyebrow">
            <span /> UN BARRIO QUE NOS UNE
          </div>
          <h1>
            Lo que hace
            <br />
            único a nuestro
            <br />
            <em>Ciudad Jardín.</em>
          </h1>
          <p className="intro">{brand.description}</p>
          <div className="section-line" />
          <div className="panel-label">
            <span>EXPLORÁ EL BARRIO</span>
            <SlidersHorizontal size={15} />
          </div>
          <AddressSearch
            onResult={(r) => {
              setFocus([r.lng, r.lat]);
              setPoint([r.lng, r.lat]);
            }}
          />
          <div className="filter-row" aria-label="Filtrar por adhesión">
            {[
              ["ALL", "Todos"],
              ["ADHERIDO", "Adheridos"],
              ["SIN_ADHESION", "Sin adhesión"],
            ].map(([id, label]) => (
              <button
                key={id}
                className={filter === id ? "filter active" : "filter"}
                onClick={() => {
                  setFilter(id);
                  setSelected(null);
                }}
              >
                {id === "ADHERIDO" && <span className="tiny-dot" />}
                {label}
              </button>
            ))}
          </div>
          <label className="category-label">
            <span className="sr-only">Categoría</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">Todas las categorías</option>
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <div className="results-heading">
            <span>{visible.length} comercios en el mapa</span>
            <span>CIUDAD JARDÍN</span>
          </div>
          {notice ? (
            <p role="alert" className="notice">
              {notice}
            </p>
          ) : loaded && visible.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">
                <Leaf size={26} />
              </span>
              <h2>
                {businesses.length
                  ? "No hay coincidencias"
                  : "El mapa empieza con vos"}
              </h2>
              <p>
                {businesses.length
                  ? "Probá con otra categoría o estado."
                  : "Cada comercio tiene una historia. Ayudanos a sumar la primera."}
              </p>
              <Link href="/sumar">
                Proponer un comercio <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <div className="business-list">
              {visible.map((b) => (
                <button
                  key={b.id}
                  onClick={() => {
                    setSelected(b);
                    setFocus([b.lng, b.lat]);
                  }}
                >
                  <span
                    className={
                      b.adhesion === "ADHERIDO" && b.qr_status === "ACTIVE"
                        ? "list-seal"
                        : "list-seal neutral"
                    }
                  >
                    {b.adhesion === "ADHERIDO" && b.qr_status === "ACTIVE" ? (
                      <Check size={16} />
                    ) : (
                      <MapPin size={16} />
                    )}
                  </span>
                  <span>
                    <strong>{b.name}</strong>
                    <small>{b.address_normalized}</small>
                  </span>
                  <ArrowRight size={16} />
                </button>
              ))}
            </div>
          )}
          <div className="community-note">
            <Heart size={18} />
            <p>
              Hecho entre vecinos.
              <br />
              <strong>Para cuidar lo que compartimos.</strong>
            </p>
          </div>
        </aside>
        <section className="map-region" aria-label="Explorar mapa">
          <MapLoader
            businesses={visible}
            onSelect={setSelected}
            focus={focus}
            point={point}
          />
          <div className="map-top-label">
            <span className="tiny-dot" /> CIUDAD JARDÍN{" "}
            <span className="map-label-divider" /> Buenos Aires
          </div>
          <div className="map-orientation">
            N<span>↑</span>
          </div>
          <div className="map-bottom">
            <div className="map-legend">
              <span>
                <i className="legend-seal">✓</i> Adherido
              </span>
              <span>
                <i className="legend-seal neutral">◇</i> Sin adhesión registrada
              </span>
            </div>
            <div className="boundary-caption">
              <span /> Límite de Ciudad Jardín
            </div>
          </div>
          {selected && (
            <article className="selected-card">
              <button
                className="icon-button close"
                aria-label="Cerrar ficha"
                onClick={() => setSelected(null)}
              >
                <X size={18} />
              </button>
              <div className="eyebrow">
                <ShieldCheck size={15} /> COMERCIO DEL BARRIO
              </div>
              <h2>{selected.name}</h2>
              <p>{selected.address_normalized}</p>
              <p className="status-text">
                {selected.qr_status === "SUSPENDED"
                  ? "Adhesión temporalmente suspendida"
                  : selected.qr_status === "REVOKED"
                    ? "Esta placa ya no acredita una adhesión vigente."
                    : selected.adhesion === "ADHERIDO"
                      ? "✓ Adhesión verificada"
                      : "◇ Sin adhesión registrada."}
              </p>
              <Link className="button button-dark" href={`/v/${selected.code}`}>
                Ver ficha <ArrowRight size={16} />
              </Link>
            </article>
          )}
          <div className="mobile-map-hint">
            <ArrowDown size={14} /> Explorá los comercios de tu barrio
          </div>
        </section>
      </main>
      <footer className="site-footer">
        <span>
          <Leaf size={14} /> Pequeños compromisos. Un gran barrio.
        </span>
        <Link href="/acerca">
          Sobre esta iniciativa <ArrowRight size={13} />
        </Link>
        <Link href="/admin">Administración</Link>
      </footer>
    </div>
  );
}
function ArrowUpIcon() {
  return <span aria-hidden="true">↗</span>;
}
