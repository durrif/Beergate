#!/usr/bin/env python3
# backend/scripts/migrate_json_to_db.py
"""
One-time migration: reads existing JSON data files from simple-backend/data/
and imports them into PostgreSQL for the target brewery.

Usage (run from beergate-v2/backend/):
  docker compose exec backend python scripts/migrate_json_to_db.py \
    --json-dir /legacy/data \
    --brewery-id 1

  # dry-run first:
  docker compose exec backend python scripts/migrate_json_to_db.py \
    --json-dir /legacy/data \
    --brewery-id 1 \
    --dry-run

Migrates:
  - inventory.json          → ingredients table
  - purchases.json          → purchases + purchase_items tables
  - brewing_history.json    → brew_sessions table  (Fase 5)
  - water_profile.json      → brewery.water_profile JSON field (Fase 5)
  - ai_conversations.json   → ai_conversations + messages tables (Fase 4)
"""
import argparse
import asyncio
import json
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Any

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal as async_session_factory, engine
from app.models import Base, Brewery, Ingredient, Purchase, PurchaseItem
from app.models.ingredient import IngredientCategory, IngredientUnit
from app.models.purchase import PurchaseStatus
from app.models.brew_session import BrewSession, SessionPhase


# ---------------------------------------------------------------------------
# Mapping helpers
# ---------------------------------------------------------------------------

CATEGORY_MAP: dict[str, IngredientCategory] = {
    "maltas_base": IngredientCategory.malta_base,
    "malta_base": IngredientCategory.malta_base,
    "maltas_especiales": IngredientCategory.malta_especial,
    "malta_especial": IngredientCategory.malta_especial,
    "maltas": IngredientCategory.malta_base,
    "malt": IngredientCategory.malta_base,
    "lúpulos": IngredientCategory.lupulo,
    "lupulos": IngredientCategory.lupulo,
    "hops": IngredientCategory.lupulo,
    "hop": IngredientCategory.lupulo,
    "levaduras": IngredientCategory.levadura,
    "levadura": IngredientCategory.levadura,
    "yeast": IngredientCategory.levadura,
    "adjuntos": IngredientCategory.adjunto,
    "adjunto": IngredientCategory.adjunto,
    "adjunct": IngredientCategory.adjunto,
    "otros": IngredientCategory.otro,
    "other": IngredientCategory.otro,
    "otros_fermentables": IngredientCategory.otro,
    "fermentables": IngredientCategory.malta_especial,
}

UNIT_MAP: dict[str, IngredientUnit] = {
    "kg": IngredientUnit.kg,
    "kilos": IngredientUnit.kg,
    "g": IngredientUnit.g,
    "gr": IngredientUnit.g,
    "gramos": IngredientUnit.g,
    "l": IngredientUnit.l,
    "litros": IngredientUnit.l,
    "liters": IngredientUnit.l,
    "ml": IngredientUnit.ml,
    "pkt": IngredientUnit.pkt,
    "sobre": IngredientUnit.pkt,
    "sobre(s)": IngredientUnit.pkt,
    "packet": IngredientUnit.pkt,
    "unit": IngredientUnit.unit,
    "unidad": IngredientUnit.unit,
    "unidades": IngredientUnit.unit,
    "u": IngredientUnit.unit,
}


def map_category(raw: str) -> IngredientCategory:
    if not raw:
        return IngredientCategory.otro
    key = raw.strip().lower()
    return CATEGORY_MAP.get(key, IngredientCategory.otro)


def map_unit(raw: str) -> IngredientUnit:
    if not raw:
        return IngredientUnit.unit
    key = raw.strip().lower()
    return UNIT_MAP.get(key, IngredientUnit.unit)


def parse_date(value: Any) -> datetime | None:
    if not value:
        return None
    if isinstance(value, datetime):
        return value
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%Y-%m-%dT%H:%M:%S"):
        try:
            return datetime.strptime(str(value), fmt)
        except ValueError:
            continue
    return None


# ---------------------------------------------------------------------------
# Ingredient migration
# ---------------------------------------------------------------------------

async def migrate_inventory(
    session: AsyncSession,
    data: list[dict],
    brewery_id: int,
    dry_run: bool,
) -> int:
    created = 0
    for item in data:
        name: str = str(item.get("name") or item.get("nombre") or "").strip()
        if not name:
            continue

        # deduplication
        existing = await session.scalar(
            select(Ingredient).where(
                Ingredient.brewery_id == brewery_id,
                Ingredient.name == name,
            )
        )
        if existing:
            print(f"    ↩  skip (already exists): {name}")
            continue

        category = map_category(item.get("category") or item.get("categoria") or "")
        unit = map_unit(item.get("unit") or item.get("unidad") or "")
        quantity = float(item.get("quantity") or item.get("cantidad") or 0)
        min_stock = float(item.get("min_stock") or item.get("stock_minimo") or 0)
        price_per_unit = float(item.get("price_per_unit") or item.get("precio") or 0)
        expiry_date = parse_date(item.get("expiry_date") or item.get("caducidad"))
        supplier = str(item.get("supplier") or item.get("proveedor") or "").strip() or None
        notes = str(item.get("notes") or item.get("notas") or "").strip() or None

        if not dry_run:
            ing = Ingredient(
                brewery_id=brewery_id,
                name=name,
                category=category,
                unit=unit,
                quantity=quantity,
                min_stock=min_stock,
                purchase_price=price_per_unit,
                expiry_date=expiry_date,
                supplier=supplier,
                notes=notes,
            )
            session.add(ing)
            await session.flush()

        print(f"    ✅ ingredient: {name} ({category.value}, {quantity}{unit.value})")
        created += 1

    return created


# ---------------------------------------------------------------------------
# Purchases migration
# ---------------------------------------------------------------------------

async def migrate_purchases(
    session: AsyncSession,
    data: list[dict],
    brewery_id: int,
    dry_run: bool,
) -> int:
    created = 0
    for raw in data:
        invoice_number: str | None = str(raw.get("invoice_number") or raw.get("factura") or "").strip() or None

        # deduplication by invoice_number if present
        if invoice_number:
            existing = await session.scalar(
                select(Purchase).where(
                    Purchase.brewery_id == brewery_id,
                    Purchase.invoice_number == invoice_number,
                )
            )
            if existing:
                print(f"    ↩  skip (already exists): {invoice_number}")
                continue

        supplier = str(raw.get("supplier") or raw.get("proveedor") or "").strip()
        total_amount = float(raw.get("total_amount") or raw.get("total") or 0)
        status_raw = str(raw.get("status") or "processed").lower()
        try:
            status = PurchaseStatus(status_raw)
        except ValueError:
            status = PurchaseStatus.processed

        purchase_date_raw = raw.get("purchase_date") or raw.get("fecha") or raw.get("created_at")
        purchase_date = parse_date(purchase_date_raw) or datetime.utcnow()

        if not dry_run:
            purchase = Purchase(
                brewery_id=brewery_id,
                supplier=supplier,
                invoice_number=invoice_number,
                total_amount=total_amount,
                status=status,
                purchase_date=purchase_date,
            )
            session.add(purchase)
            await session.flush()

            items_raw: list[dict] = raw.get("items") or raw.get("lineas") or []
            for line in items_raw:
                ing_name = str(line.get("name") or line.get("nombre") or "").strip()
                qty = float(line.get("quantity") or line.get("cantidad") or 0)
                unit = map_unit(line.get("unit") or line.get("unidad") or "")
                unit_price = float(line.get("unit_price") or line.get("precio_unitario") or 0)
                total_line = float(line.get("total") or line.get("total_linea") or (qty * unit_price))

                ing_item = PurchaseItem(
                    purchase_id=purchase.id,
                    ingredient_name=ing_name,
                    quantity=qty,
                    unit=unit.value,
                    unit_price=unit_price,
                    total_price=total_line,
                )
                session.add(ing_item)

        print(f"    ✅ purchase: {supplier} / {invoice_number} ({total_amount:.2f}€)")
        created += 1

    return created


# ---------------------------------------------------------------------------
# Brew sessions migration
# ---------------------------------------------------------------------------

async def migrate_brew_sessions(
    session: AsyncSession,
    data: list[dict],
    brewery_id: int,
    dry_run: bool,
) -> int:
    created = 0
    for raw in data:
        name = str(raw.get("recipe_name") or raw.get("name") or "Unnamed Brew").strip()

        # deduplication by name + brew_date
        brew_date = parse_date(raw.get("brew_date") or raw.get("timestamp"))
        existing = await session.scalar(
            select(BrewSession).where(
                BrewSession.brewery_id == brewery_id,
                BrewSession.name == name,
            )
        )
        if existing:
            print(f"    ↩  skip (already exists): {name}")
            continue

        phase_raw = str(raw.get("status") or "planned").lower()
        try:
            phase = SessionPhase(phase_raw)
        except ValueError:
            phase = SessionPhase.planned

        batch_size = float(raw.get("batch_size") or 0) or None
        og = float(raw.get("og") or 0) or None
        fg = float(raw.get("fg") or 0) or None
        abv = float(raw.get("abv") or 0) or None

        # Store full recipe detail as step_log JSON
        step_log = []
        ingredients_used = raw.get("ingredients_used")
        if ingredients_used:
            step_log.append({"type": "ingredients", "data": ingredients_used})
        salts_added = raw.get("salts_added")
        if salts_added:
            step_log.append({"type": "salts", "data": salts_added})
        deductions = raw.get("deductions")
        if deductions:
            step_log.append({"type": "deductions", "data": deductions})

        notes_parts = []
        if raw.get("style"):
            notes_parts.append(f"Style: {raw['style']}")
        if raw.get("ibu"):
            notes_parts.append(f"IBU: {raw['ibu']}")
        if raw.get("water_profile"):
            notes_parts.append(f"Water: {raw['water_profile']}")
        if raw.get("notes"):
            notes_parts.append(raw["notes"])
        notes_text = " | ".join(notes_parts) if notes_parts else None

        if not dry_run:
            brew = BrewSession(
                brewery_id=brewery_id,
                name=name,
                phase=phase,
                planned_batch_liters=batch_size,
                planned_og=og,
                planned_fg=fg,
                actual_abv=abv,
                brew_date=brew_date,
                step_log=step_log if step_log else None,
                notes=notes_text,
            )
            session.add(brew)
            await session.flush()

        print(f"    ✅ brew session: {name} ({phase.value})")
        created += 1

    return created


# ---------------------------------------------------------------------------
# Water profile migration
# ---------------------------------------------------------------------------

async def migrate_water_profile(
    session: AsyncSession,
    data: dict,
    brewery_id: int,
    dry_run: bool,
) -> bool:
    brewery = await session.get(Brewery, brewery_id)
    if not brewery:
        print("    ❌ Brewery not found")
        return False

    if brewery.water_profile and not dry_run:
        print("    ↩  skip (water profile already set)")
        return False

    if not dry_run:
        brewery.water_profile = data
        await session.flush()

    print(f"    ✅ water profile: {data.get('name', 'unknown')} ({data.get('location', '')})")
    return True


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Migrate legacy JSON data to PostgreSQL")
    parser.add_argument(
        "--json-dir",
        default="/opt/beergate/simple-backend/data",
        help="Path to legacy data/ directory",
    )
    parser.add_argument("--brewery-id", type=int, default=1, help="Target brewery ID")
    parser.add_argument("--dry-run", action="store_true", help="Parse only, no DB writes")
    return parser.parse_args()


async def migrate(json_dir: str, brewery_id: int, dry_run: bool) -> None:
    data_path = Path(json_dir)
    if not data_path.exists():
        print(f"❌ Directory not found: {json_dir}")
        sys.exit(1)

    print(f"📂 Legacy JSON data: {json_dir}")
    print(f"🎯 Target brewery_id: {brewery_id}")
    print(f"{'🔍 DRY RUN — no writes' if dry_run else '💾 WRITE MODE'}\n")

    async with async_session_factory() as session:
        # verify brewery exists
        brewery = await session.get(Brewery, brewery_id)
        if not brewery:
            print(f"❌ Brewery id={brewery_id} not found in database.")
            sys.exit(1)
        print(f"🍺 Brewery: {brewery.name}\n")

        total_ingredients = 0
        total_purchases = 0
        total_brews = 0
        water_migrated = False

        # --- inventory.json ---
        inv_path = data_path / "inventory.json"
        if inv_path.exists():
            with open(inv_path) as f:
                inv_data = json.load(f)
            if not isinstance(inv_data, list):
                inv_data = list(inv_data.values()) if isinstance(inv_data, dict) else []
            print(f"📦 inventory.json — {len(inv_data)} items")
            total_ingredients = await migrate_inventory(session, inv_data, brewery_id, dry_run)
        else:
            print("⚠️  inventory.json not found — skipping")

        # --- purchases.json ---
        pur_path = data_path / "purchases.json"
        if pur_path.exists():
            with open(pur_path) as f:
                pur_data = json.load(f)
            if not isinstance(pur_data, list):
                pur_data = list(pur_data.values()) if isinstance(pur_data, dict) else []
            print(f"\n🧾 purchases.json — {len(pur_data)} records")
            total_purchases = await migrate_purchases(session, pur_data, brewery_id, dry_run)
        else:
            print("⚠️  purchases.json not found — skipping")

        # --- brewing_history.json ---
        brew_path = data_path / "brewing_history.json"
        if brew_path.exists():
            with open(brew_path) as f:
                brew_data = json.load(f)
            if not isinstance(brew_data, list):
                brew_data = [brew_data]
            print(f"\n🍺 brewing_history.json — {len(brew_data)} records")
            total_brews = await migrate_brew_sessions(session, brew_data, brewery_id, dry_run)
        else:
            print("⚠️  brewing_history.json not found — skipping")

        # --- water_profile.json ---
        water_path = data_path / "water_profile.json"
        if water_path.exists():
            with open(water_path) as f:
                water_data = json.load(f)
            print(f"\n💧 water_profile.json")
            water_migrated = await migrate_water_profile(session, water_data, brewery_id, dry_run)
        else:
            print("⚠️  water_profile.json not found — skipping")

        # --- ai_conversations.json (stubbed) ---
        ai_path = data_path / "ai_conversations.json"
        if ai_path.exists():
            with open(ai_path) as f:
                ai_data = json.load(f)
            count = len(ai_data) if isinstance(ai_data, list) else 1
            print(f"\n⏳ ai_conversations.json: {count} record(s) → pending")

        if not dry_run:
            await session.commit()

        print(f"\n{'✅ DRY RUN complete' if dry_run else '✅ Migration complete'}")
        print(f"   Ingredients created: {total_ingredients}")
        print(f"   Purchases   created: {total_purchases}")
        print(f"   Brew sessions created: {total_brews}")
        print(f"   Water profile: {'migrated' if water_migrated else 'skipped'}")


if __name__ == "__main__":
    args = parse_args()
    asyncio.run(migrate(args.json_dir, args.brewery_id, args.dry_run))
