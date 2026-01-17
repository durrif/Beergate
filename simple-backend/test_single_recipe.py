#!/usr/bin/env python3
"""Test para extraer datos de una sola receta y ver la estructura HTML"""

import requests
from bs4 import BeautifulSoup
import re

def test_recipe():
    """Prueba con una receta individual"""
    
    # URL de una de tus recetas
    recipe_url = "https://www.brewersfriend.com/homebrew/recipe/view/1346510/1906-helles-bock"
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    
    response = requests.get(recipe_url, headers=headers)
    soup = BeautifulSoup(response.content, 'html.parser')
    
    print("=" * 50)
    print("ANALIZANDO ESTRUCTURA HTML")
    print("=" * 50)
    
    # Buscar tablas
    tables = soup.find_all('table')
    print(f"\n📊 Se encontraron {len(tables)} tablas")
    
    for idx, table in enumerate(tables):
        print(f"\nTabla {idx + 1}:")
        if table.get('class'):
            print(f"  Clases: {table.get('class')}")
        
        rows = table.find_all('tr')
        print(f"  Filas: {len(rows)}")
        
        # Mostrar primeras 5 filas
        for i, row in enumerate(rows[:5]):
            cells = row.find_all(['td', 'th'])
            if cells:
                text = ' | '.join([c.get_text(strip=True) for c in cells])
                print(f"    Row {i+1}: {text[:100]}")
    
    print("\n" + "=" * 50)
    print("BUSCANDO STATS ESPECÍFICOS")
    print("=" * 50)
    
    # Buscar stats específicos
    stats_keywords = ['ABV', 'IBU', 'SRM', 'OG', 'FG', 'Style', 'Batch Size']
    
    for keyword in stats_keywords:
        print(f"\n🔍 Buscando '{keyword}':")
        matches = soup.find_all(string=re.compile(keyword, re.IGNORECASE))
        for match in matches[:3]:  # Solo primeros 3 resultados
            parent = match.parent
            context = parent.get_text(strip=True)[:200]
            print(f"  - {context}")

if __name__ == '__main__':
    test_recipe()
