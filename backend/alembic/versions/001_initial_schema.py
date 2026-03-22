"""Initial schema — all tables

Revision ID: 001
Revises: -
Create Date: 2025-01-01 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ------------------------------------------------------------------ enums
    # Use DO blocks to safely create enum types (idempotent)
    for stmt in [
        "DO $$ BEGIN CREATE TYPE role_enum AS ENUM ('admin', 'brewer', 'viewer'); EXCEPTION WHEN duplicate_object THEN NULL; END $$",
        "DO $$ BEGIN CREATE TYPE ingredient_category_enum AS ENUM ('malt', 'hop', 'yeast', 'adjunct', 'water_chemical', 'equipment', 'other'); EXCEPTION WHEN duplicate_object THEN NULL; END $$",
        "DO $$ BEGIN CREATE TYPE ingredient_unit_enum AS ENUM ('kg', 'g', 'l', 'ml', 'unit', 'packet', 'oz', 'lb'); EXCEPTION WHEN duplicate_object THEN NULL; END $$",
        "DO $$ BEGIN CREATE TYPE purchase_status_enum AS ENUM ('pending', 'received', 'partial', 'cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$",
        "DO $$ BEGIN CREATE TYPE message_role_enum AS ENUM ('user', 'assistant', 'system'); EXCEPTION WHEN duplicate_object THEN NULL; END $$",
        "DO $$ BEGIN CREATE TYPE recipe_status_enum AS ENUM ('draft', 'published', 'archived'); EXCEPTION WHEN duplicate_object THEN NULL; END $$",
        "DO $$ BEGIN CREATE TYPE session_phase_enum AS ENUM ('planned', 'mashing', 'lautering', 'boiling', 'cooling', 'fermenting', 'conditioning', 'packaging', 'completed', 'aborted'); EXCEPTION WHEN duplicate_object THEN NULL; END $$",
        "DO $$ BEGIN CREATE TYPE alert_type_enum AS ENUM ('price_drop', 'back_in_stock', 'price_increase'); EXCEPTION WHEN duplicate_object THEN NULL; END $$",
    ]:
        op.execute(stmt)

    # ------------------------------------------------------------------ users
    op.create_table(
        "users",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("email", sa.String(255), nullable=False, unique=True, index=True),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(100), nullable=True),
        sa.Column("role", postgresql.ENUM("admin", "brewer", "viewer", name="role_enum", create_type=False), nullable=False, server_default="brewer"),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), onupdate=sa.text("now()"), nullable=False),
    )

    # --------------------------------------------------------------- breweries
    op.create_table(
        "breweries",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("slug", sa.String(100), nullable=False, unique=True, index=True),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("owner_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("settings", postgresql.JSONB, nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), onupdate=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_breweries_owner_id", "breweries", ["owner_id"])

    # ------------------------------------------------------------ brewery_members
    op.create_table(
        "brewery_members",
        sa.Column("brewery_id", sa.Integer, sa.ForeignKey("breweries.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("role", postgresql.ENUM("admin", "brewer", "viewer", name="role_enum", create_type=False), nullable=False, server_default="brewer"),
        sa.Column("joined_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )

    # ------------------------------------------------------------ ingredients
    op.create_table(
        "ingredients",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("brewery_id", sa.Integer, sa.ForeignKey("breweries.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("category", postgresql.ENUM(
            "malt", "hop", "yeast", "adjunct", "water_chemical", "equipment", "other",
            name="ingredient_category_enum", create_type=False
        ), nullable=False),
        sa.Column("unit", postgresql.ENUM(
            "kg", "g", "l", "ml", "unit", "packet", "oz", "lb",
            name="ingredient_unit_enum", create_type=False
        ), nullable=False, server_default="kg"),
        sa.Column("quantity", sa.Numeric(12, 3), nullable=False, server_default="0"),
        sa.Column("min_stock", sa.Numeric(12, 3), nullable=False, server_default="0"),
        sa.Column("price_per_unit", sa.Numeric(10, 4), nullable=True),
        sa.Column("supplier", sa.String(200), nullable=True),
        sa.Column("supplier_url", sa.String(500), nullable=True),
        sa.Column("notes", sa.Text, nullable=True),
        sa.Column("expiry_date", sa.Date, nullable=True),
        sa.Column("ean", sa.String(30), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), onupdate=sa.text("now()"), nullable=False),
    )

    # ------------------------------------------------------------- purchases
    op.create_table(
        "purchases",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("brewery_id", sa.Integer, sa.ForeignKey("breweries.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("supplier", sa.String(200), nullable=False),
        sa.Column("invoice_number", sa.String(100), nullable=True),
        sa.Column("invoice_date", sa.Date, nullable=True),
        sa.Column("total_amount", sa.Numeric(12, 2), nullable=True),
        sa.Column("currency", sa.String(3), nullable=False, server_default="EUR"),
        sa.Column("status", postgresql.ENUM(
            "pending", "received", "partial", "cancelled",
            name="purchase_status_enum", create_type=False
        ), nullable=False, server_default="pending"),
        sa.Column("notes", sa.Text, nullable=True),
        sa.Column("pdf_path", sa.String(500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), onupdate=sa.text("now()"), nullable=False),
    )

    # --------------------------------------------------------- purchase_items
    op.create_table(
        "purchase_items",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("purchase_id", sa.Integer, sa.ForeignKey("purchases.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("ingredient_id", sa.Integer, sa.ForeignKey("ingredients.id", ondelete="SET NULL"), nullable=True),
        sa.Column("raw_name", sa.String(200), nullable=False),
        sa.Column("quantity", sa.Numeric(12, 3), nullable=False),
        sa.Column("unit", postgresql.ENUM(
            "kg", "g", "l", "ml", "unit", "packet", "oz", "lb",
            name="ingredient_unit_enum", create_type=False
        ), nullable=False, server_default="kg"),
        sa.Column("unit_price", sa.Numeric(10, 4), nullable=True),
        sa.Column("line_total", sa.Numeric(12, 2), nullable=True),
    )

    # ------------------------------------------------------- ai_conversations
    op.create_table(
        "ai_conversations",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("brewery_id", sa.Integer, sa.ForeignKey("breweries.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("title", sa.String(200), nullable=True),
        sa.Column("context_page", sa.String(50), nullable=True),
        sa.Column("context_data", postgresql.JSONB, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), onupdate=sa.text("now()"), nullable=False),
    )

    # ---------------------------------------------------------- ai_messages
    op.create_table(
        "ai_messages",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("conversation_id", sa.Integer, sa.ForeignKey("ai_conversations.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("role", postgresql.ENUM("user", "assistant", "system", name="message_role_enum", create_type=False), nullable=False),
        sa.Column("content", sa.Text, nullable=False),
        sa.Column("input_tokens", sa.Integer, nullable=True),
        sa.Column("output_tokens", sa.Integer, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )

    # ------------------------------------------------------------- recipes
    op.create_table(
        "recipes",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("brewery_id", sa.Integer, sa.ForeignKey("breweries.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("style", sa.String(100), nullable=True),
        sa.Column("style_code", sa.String(20), nullable=True),
        sa.Column("batch_size_liters", sa.Numeric(8, 2), nullable=True),
        sa.Column("efficiency_pct", sa.Numeric(5, 2), nullable=True),
        sa.Column("og", sa.Numeric(6, 4), nullable=True),
        sa.Column("fg", sa.Numeric(6, 4), nullable=True),
        sa.Column("abv", sa.Numeric(5, 2), nullable=True),
        sa.Column("ibu", sa.Numeric(6, 1), nullable=True),
        sa.Column("srm", sa.Numeric(6, 1), nullable=True),
        sa.Column("ebc", sa.Numeric(6, 1), nullable=True),
        sa.Column("fermentables", postgresql.JSONB, nullable=False, server_default="[]"),
        sa.Column("hops", postgresql.JSONB, nullable=False, server_default="[]"),
        sa.Column("yeasts", postgresql.JSONB, nullable=False, server_default="[]"),
        sa.Column("adjuncts", postgresql.JSONB, nullable=False, server_default="[]"),
        sa.Column("mash_steps", postgresql.JSONB, nullable=False, server_default="[]"),
        sa.Column("water_profile", postgresql.JSONB, nullable=True),
        sa.Column("notes", sa.Text, nullable=True),
        sa.Column("status", postgresql.ENUM("draft", "published", "archived", name="recipe_status_enum", create_type=False), nullable=False, server_default="draft"),
        sa.Column("external_id", sa.String(100), nullable=True),
        sa.Column("external_source", sa.String(50), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), onupdate=sa.text("now()"), nullable=False),
    )

    # --------------------------------------------------------- brew_sessions
    op.create_table(
        "brew_sessions",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("brewery_id", sa.Integer, sa.ForeignKey("breweries.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("recipe_id", sa.Integer, sa.ForeignKey("recipes.id", ondelete="SET NULL"), nullable=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("batch_number", sa.Integer, nullable=True),
        sa.Column("phase", postgresql.ENUM(
            "planned", "mashing", "lautering", "boiling", "cooling",
            "fermenting", "conditioning", "packaging", "completed", "aborted",
            name="session_phase_enum", create_type=False
        ), nullable=False, server_default="planned"),
        sa.Column("planned_og", sa.Numeric(6, 4), nullable=True),
        sa.Column("actual_og", sa.Numeric(6, 4), nullable=True),
        sa.Column("planned_fg", sa.Numeric(6, 4), nullable=True),
        sa.Column("actual_fg", sa.Numeric(6, 4), nullable=True),
        sa.Column("planned_abv", sa.Numeric(5, 2), nullable=True),
        sa.Column("actual_abv", sa.Numeric(5, 2), nullable=True),
        sa.Column("planned_efficiency", sa.Numeric(5, 2), nullable=True),
        sa.Column("actual_efficiency", sa.Numeric(5, 2), nullable=True),
        sa.Column("brew_date", sa.Date, nullable=True),
        sa.Column("fermentation_start", sa.DateTime(timezone=True), nullable=True),
        sa.Column("packaging_date", sa.Date, nullable=True),
        sa.Column("step_log", postgresql.JSONB, nullable=False, server_default="[]"),
        sa.Column("notes", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), onupdate=sa.text("now()"), nullable=False),
    )

    # ----------------------------------------------------- fermentation_data
    op.create_table(
        "fermentation_data",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("session_id", sa.Integer, sa.ForeignKey("brew_sessions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("temperature", sa.Numeric(5, 2), nullable=True),
        sa.Column("gravity", sa.Numeric(6, 4), nullable=True),
        sa.Column("angle", sa.Numeric(7, 4), nullable=True),
        sa.Column("battery", sa.Numeric(5, 3), nullable=True),
        sa.Column("rssi", sa.Integer, nullable=True),
        sa.Column("source", sa.String(20), nullable=False, server_default="manual"),
        sa.Column("recorded_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_fermentation_data_session_id", "fermentation_data", ["session_id"])
    op.create_index("ix_fermentation_data_recorded_at", "fermentation_data", ["recorded_at"])

    # --------------------------------------------------------- price_records
    op.create_table(
        "price_records",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("ingredient_name", sa.String(200), nullable=False, index=True),
        sa.Column("shop_name", sa.String(100), nullable=False),
        sa.Column("shop_url", sa.String(500), nullable=True),
        sa.Column("product_url", sa.String(500), nullable=True),
        sa.Column("product_name", sa.String(300), nullable=True),
        sa.Column("price", sa.Numeric(10, 4), nullable=True),
        sa.Column("unit", sa.String(30), nullable=True),
        sa.Column("price_per_kg", sa.Numeric(10, 4), nullable=True),
        sa.Column("in_stock", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("scraped_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )

    # ---------------------------------------------------------- price_alerts
    op.create_table(
        "price_alerts",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("brewery_id", sa.Integer, sa.ForeignKey("breweries.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("ingredient_name", sa.String(200), nullable=False),
        sa.Column("alert_type", postgresql.ENUM("price_drop", "back_in_stock", "price_increase", name="alert_type_enum", create_type=False), nullable=False),
        sa.Column("threshold_price", sa.Numeric(10, 4), nullable=True),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("last_triggered_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("price_alerts")
    op.drop_table("price_records")
    op.drop_table("fermentation_data")
    op.drop_table("brew_sessions")
    op.drop_table("recipes")
    op.drop_table("ai_messages")
    op.drop_table("ai_conversations")
    op.drop_table("purchase_items")
    op.drop_table("purchases")
    op.drop_table("ingredients")
    op.drop_table("brewery_members")
    op.drop_table("breweries")
    op.drop_table("users")

    for enum_name in (
        "alert_type_enum",
        "session_phase_enum",
        "recipe_status_enum",
        "message_role_enum",
        "purchase_status_enum",
        "ingredient_unit_enum",
        "ingredient_category_enum",
        "role_enum",
    ):
        op.execute(f"DROP TYPE IF EXISTS {enum_name}")
