"""Load initial malt inventory from CSV."""
import asyncio
import pandas as pd
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.models.ingredient import Ingredient, IngredientCategory, IngredientStatus
from app.models.user import User, UserRole
from app.core.security import get_password_hash
from decimal import Decimal
import uuid


async def load_initial_data():
    """Load initial inventory and create admin user."""
    # Create async engine
    engine = create_async_engine(settings.DATABASE_URL, echo=True)
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with async_session() as session:
        # Create admin user if not exists
        from sqlalchemy import select
        result = await session.execute(
            select(User).where(User.email == "admin@beergate.com")
        )
        admin = result.scalar_one_or_none()
        
        if not admin:
            admin = User(
                email="admin@beergate.com",
                hashed_password=get_password_hash("admin123"),
                full_name="Administrator",
                role=UserRole.ADMIN,
                is_active=True
            )
            session.add(admin)
            await session.commit()
            await session.refresh(admin)
            print(f"✓ Created admin user: {admin.email}")
        else:
            print(f"✓ Admin user already exists: {admin.email}")
        
        # Load malts from CSV
        try:
            df = pd.read_csv('../inventario_maltas_clean.csv')
            
            for _, row in df.iterrows():
                # Check if ingredient already exists
                result = await session.execute(
                    select(Ingredient).where(
                        Ingredient.name == row['nombre'],
                        Ingredient.user_id == admin.id
                    )
                )
                existing = result.scalar_one_or_none()
                
                if existing:
                    print(f"  - Skipping {row['nombre']} (already exists)")
                    continue
                
                ingredient = Ingredient(
                    user_id=admin.id,
                    name=row['nombre'],
                    category=IngredientCategory.MALT,
                    subcategory="specialty" if "Cara" in row['nombre'] or "Munich" in row['nombre'] or "Vienna" in row['nombre'] else "base",
                    quantity=Decimal(str(row['cantidad_kg'])),
                    unit="kg",
                    supplier=row['proveedor'],
                    status=IngredientStatus.AVAILABLE,
                    min_threshold=Decimal("2.0") if "Pilsen" in row['nombre'] or "Pale" in row['nombre'] else Decimal("0.5")
                )
                
                session.add(ingredient)
                print(f"  + Added {row['nombre']}: {row['cantidad_kg']} kg")
            
            await session.commit()
            print(f"\n✓ Loaded {len(df)} malts into inventory")
            
        except FileNotFoundError:
            print("Warning: inventario_maltas_clean.csv not found")
        except Exception as e:
            print(f"Error loading malts: {e}")


if __name__ == "__main__":
    print("Loading initial data...\n")
    asyncio.run(load_initial_data())
    print("\n✓ Done!")
