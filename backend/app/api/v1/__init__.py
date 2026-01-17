from fastapi import APIRouter
from app.api.v1.endpoints import auth, inventory, purchases, recipes, recommendations, admin

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(inventory.router, prefix="/inventory", tags=["inventory"])
api_router.include_router(purchases.router, prefix="/purchases", tags=["purchases"])
api_router.include_router(recipes.router, prefix="/recipes", tags=["recipes"])
api_router.include_router(recommendations.router, prefix="/recommendations", tags=["recommendations"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
