"""ML tasks for ingredient matching and recommendations."""
from app.workers.celery_app import celery_app
from sentence_transformers import SentenceTransformer
import numpy as np
from typing import List, Dict


# Load model (cached)
_model = None


def get_model():
    """Get or load sentence transformer model."""
    global _model
    if _model is None:
        _model = SentenceTransformer('all-MiniLM-L6-v2')
    return _model


@celery_app.task(name="app.workers.ml_tasks.match_ingredient")
def match_ingredient(product_name: str, candidate_ingredients: List[Dict]) -> Dict:
    """Match a product name to existing ingredients using embeddings."""
    model = get_model()
    
    # Generate embedding for product name
    product_embedding = model.encode(product_name)
    
    # Generate embeddings for candidates
    candidate_names = [ing["name"] for ing in candidate_ingredients]
    candidate_embeddings = model.encode(candidate_names)
    
    # Calculate cosine similarities
    similarities = np.dot(candidate_embeddings, product_embedding) / (
        np.linalg.norm(candidate_embeddings, axis=1) * np.linalg.norm(product_embedding)
    )
    
    # Find best match
    best_idx = int(np.argmax(similarities))
    best_score = float(similarities[best_idx])
    
    return {
        "matched_ingredient_id": candidate_ingredients[best_idx]["id"],
        "confidence": best_score,
        "matched_name": candidate_ingredients[best_idx]["name"]
    }


@celery_app.task(name="app.workers.ml_tasks.find_substitutions")
def find_substitutions(ingredient_id: str, all_ingredients: List[Dict]) -> List[Dict]:
    """Find similar ingredients for substitution."""
    model = get_model()
    
    # Find the target ingredient
    target = next((ing for ing in all_ingredients if ing["id"] == ingredient_id), None)
    if not target:
        return []
    
    # Same category only
    candidates = [
        ing for ing in all_ingredients
        if ing["id"] != ingredient_id and ing["category"] == target["category"]
    ]
    
    if not candidates:
        return []
    
    # Generate embeddings
    target_embedding = model.encode(target["name"])
    candidate_names = [ing["name"] for ing in candidates]
    candidate_embeddings = model.encode(candidate_names)
    
    # Calculate similarities
    similarities = np.dot(candidate_embeddings, target_embedding) / (
        np.linalg.norm(candidate_embeddings, axis=1) * np.linalg.norm(target_embedding)
    )
    
    # Return top 5 matches
    top_indices = np.argsort(similarities)[::-1][:5]
    
    return [
        {
            "ingredient_id": candidates[idx]["id"],
            "name": candidates[idx]["name"],
            "similarity": float(similarities[idx]),
            "quantity_available": candidates[idx]["quantity"]
        }
        for idx in top_indices
        if similarities[idx] > 0.5  # Threshold
    ]
