"""
Brewer's Friend Recipe Scraper
Obtiene recetas del perfil público y genera estadísticas
"""
import requests
from bs4 import BeautifulSoup
from typing import List, Dict
import json
from collections import Counter
from datetime import datetime

class BrewersFriendScraper:
    def __init__(self, brewer_id: str):
        self.brewer_id = brewer_id
        self.base_url = "https://www.brewersfriend.com"
        self.profile_url = f"{self.base_url}/homebrew/brewer/{brewer_id}/durrif"
        
    def get_recipes(self) -> List[Dict]:
        """Obtiene todas las recetas del perfil"""
        try:
            print(f"🔍 Obteniendo recetas de {self.profile_url}")
            
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            
            response = requests.get(self.profile_url, headers=headers)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            recipes = []
            
            # Buscar tabla de recetas o lista
            # Ajustar selectores según la estructura real de la página
            recipe_links = soup.find_all('a', href=lambda x: x and '/homebrew/recipe/view/' in x)
            
            # Eliminar duplicados
            unique_urls = list(set([
                self.base_url + link['href'] if not link['href'].startswith('http') else link['href']
                for link in recipe_links
            ]))
            
            print(f"📋 Encontradas {len(unique_urls)} recetas únicas")
            print(f"⚠️  Para evitar bloqueos, limitando a 20 recetas")
            
            # Limitar a 20 recetas para evitar rate limiting
            for i, recipe_url in enumerate(unique_urls[:20], 1):
                print(f"  [{i}/20] Procesando...")
                recipe_data = self.get_recipe_details(recipe_url)
                if recipe_data:
                    recipes.append(recipe_data)
                
                # Pausa entre peticiones
                if i < 20:
                    import time
                    time.sleep(1)  # 1 segundo entre peticiones
            
            return recipes
            
        except Exception as e:
            print(f"❌ Error obteniendo recetas: {e}")
            return []
    
    def get_recipe_details(self, recipe_url: str) -> Dict:
        """Obtiene detalles de una receta específica"""
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            
            response = requests.get(recipe_url, headers=headers)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Extraer información
            recipe = {
                'url': recipe_url,
                'name': self._get_text(soup, 'h1'),
                'style': self._extract_style(soup),
                'type': self._extract_type(soup),
                'batch_size': self._extract_batch_size(soup),
                'og': self._extract_gravity(soup, 'OG'),
                'fg': self._extract_gravity(soup, 'FG'),
                'abv': self._extract_abv(soup),
                'ibu': self._extract_ibu(soup),
                'srm': self._extract_srm(soup),
                'fermentables': self._extract_fermentables(soup),
                'hops': self._extract_hops(soup),
                'yeast': self._extract_yeast(soup),
                'scraped_at': datetime.now().isoformat()
            }
            
            print(f"  ✅ {recipe['name']} - {recipe['style']}")
            return recipe
            
        except Exception as e:
            print(f"  ❌ Error en {recipe_url}: {e}")
            return None
    
    def _get_text(self, soup, selector, default=''):
        """Extrae texto de un selector"""
        element = soup.find(selector)
        return element.get_text(strip=True) if element else default
    
    def _extract_style(self, soup):
        """Extrae el estilo de cerveza - busca en meta description primero"""
        import re
        # Primero buscar en meta description
        meta = soup.find('meta', attrs={'name': 'description'})
        if meta and meta.get('content'):
            match = re.search(r'"[^"]*"\s+(\w+[^,]*?)\s+beer\s+recipe', meta['content'])
            if match:
                return match.group(1).strip()
        
        # Fallback: buscar en Beer Stats
        style_label = soup.find(string=re.compile(r'Style:', re.IGNORECASE))
        if style_label:
            parent = style_label.find_parent()
            if parent:
                text = parent.get_text()
                style = text.split('Style:')[1].split('Boil')[0].strip()
                if style and style != 'Unknown':
                    return style
        
        # Último recurso: buscar en h1 + subtitle
        title = soup.find('h1')
        if title:
            subtitle = title.find_next('div', class_='ui sub header')
            if subtitle:
                return subtitle.get_text(strip=True)
        
        return 'Unknown'
    
    def _extract_type(self, soup):
        """Extrae el tipo (All Grain, Extract, etc) - busca en meta o Beer Stats"""
        import re
        # Primero buscar en meta description
        meta = soup.find('meta', attrs={'name': 'description'})
        if meta and meta.get('content'):
            match = re.search(r'"[^"]*"\s+\w+[^.]*?\s+beer\s+recipe\s+by\s+\w+\.\s+(\w+\s+\w+)', meta['content'])
            if match:
                brew_type = match.group(1)
                if brew_type in ['All Grain', 'Extract', 'Partial Mash', 'BIAB']:
                    return brew_type
        
        # Fallback: buscar Method en Beer Stats
        method_label = soup.find(string=re.compile(r'Method:', re.IGNORECASE))
        if method_label:
            parent = method_label.find_parent()
            if parent:
                text = parent.get_text()
                if 'All Grain' in text:
                    return 'All Grain'
                elif 'Extract' in text:
                    return 'Extract'
                elif 'Partial Mash' in text:
                    return 'Partial Mash'
                elif 'BIAB' in text:
                    return 'BIAB'
        
        return 'All Grain'  # Default
    
    def _extract_batch_size(self, soup):
        """Extrae el tamaño del batch"""
        batch_label = soup.find(string=lambda x: x and 'Batch Size:' in x)
        if batch_label:
            parent = batch_label.parent
            text = parent.get_text()
            # Extraer número
            import re
            match = re.search(r'([\d.]+)\s*(L|gal)', text)
            if match:
                return float(match.group(1))
        return 0
    
    def _extract_gravity(self, soup, gravity_type):
        """Extrae OG o FG"""
        label = soup.find(string=lambda x: x and f'{gravity_type}:' in x)
        if label:
            parent = label.parent
            text = parent.get_text()
            import re
            match = re.search(r'(1\.\d+)', text)
            if match:
                return float(match.group(1))
        return 0
    
    def _extract_abv(self, soup):
        """Extrae ABV - busca en meta description primero"""
        import re
        # Primero buscar en meta description
        meta = soup.find('meta', attrs={'name': 'description'})
        if meta and meta.get('content'):
            match = re.search(r'ABV\s+([\d.]+)%', meta['content'])
            if match:
                val = float(match.group(1))
                if 0 <= val <= 20:  # Rango razonable
                    return val
        
        # Fallback: buscar en texto
        abv_label = soup.find(string=re.compile(r'ABV\s*\(standard\)', re.IGNORECASE))
        if abv_label:
            parent = abv_label.find_parent('td')
            if parent:
                sibling = parent.find_next_sibling('td')
                if sibling:
                    match = re.search(r'([\d.]+)', sibling.get_text())
                    if match:
                        val = float(match.group(1))
                        if 0 <= val <= 20:
                            return val
        return 0
    
    def _extract_ibu(self, soup):
        """Extrae IBU - busca en meta description primero"""
        import re
        # Primero buscar en meta description
        meta = soup.find('meta', attrs={'name': 'description'})
        if meta and meta.get('content'):
            match = re.search(r'IBU\s+([\d.]+)', meta['content'])
            if match:
                val = float(match.group(1))
                if 0 <= val <= 150:  # Rango razonable
                    return val
        
        # Fallback: buscar en texto
        ibu_label = soup.find(string=re.compile(r'IBU\s*\(tinseth\)', re.IGNORECASE))
        if ibu_label:
            parent = ibu_label.find_parent('td')
            if parent:
                sibling = parent.find_next_sibling('td')
                if sibling:
                    match = re.search(r'([\d.]+)', sibling.get_text())
                    if match:
                        val = float(match.group(1))
                        if 0 <= val <= 150:
                            return val
        return 0
    
    def _extract_srm(self, soup):
        """Extrae SRM - busca en meta description primero"""
        import re
        # Primero buscar en meta description
        meta = soup.find('meta', attrs={'name': 'description'})
        if meta and meta.get('content'):
            match = re.search(r'SRM\s+([\d.]+)', meta['content'])
            if match:
                val = float(match.group(1))
                if 0 <= val <= 80:  # Rango razonable
                    return val
        
        # Fallback: buscar en texto
        srm_label = soup.find(string=re.compile(r'SRM\s*\(morey\)', re.IGNORECASE))
        if srm_label:
            parent = srm_label.find_parent('td')
            if parent:
                sibling = parent.find_next_sibling('td')
                if sibling:
                    match = re.search(r'([\d.]+)', sibling.get_text())
                    if match:
                        val = float(match.group(1))
                        if 0 <= val <= 80:
                            return val
        return 0
    
    def _extract_fermentables(self, soup):
        """Extrae lista de fermentables"""
        fermentables = []
        # Buscar tabla de fermentables
        # Esto depende de la estructura HTML específica
        return fermentables
    
    def _extract_hops(self, soup):
        """Extrae lista de lúpulos"""
        hops = []
        return hops
    
    def _extract_yeast(self, soup):
        """Extrae levadura"""
        return ''

def generate_insights(recipes: List[Dict]) -> Dict:
    """Genera estadísticas e insights de las recetas"""
    
    if not recipes:
        return {'error': 'No hay recetas para analizar'}
    
    # Estilos más elaborados
    styles = [r['style'] for r in recipes if r.get('style')]
    style_counts = Counter(styles)
    
    # Tipos (All Grain, Extract, etc)
    types = [r['type'] for r in recipes if r.get('type')]
    type_counts = Counter(types)
    
    # Promedios
    abvs = [r['abv'] for r in recipes if r.get('abv', 0) > 0]
    ibus = [r['ibu'] for r in recipes if r.get('ibu', 0) > 0]
    srms = [r['srm'] for r in recipes if r.get('srm', 0) > 0]
    
    insights = {
        'total_recipes': len(recipes),
        'styles': {
            'most_common': style_counts.most_common(10),
            'total_styles': len(style_counts),
            'distribution': dict(style_counts)
        },
        'types': {
            'distribution': dict(type_counts)
        },
        'averages': {
            'abv': round(sum(abvs) / len(abvs), 2) if abvs else 0,
            'ibu': round(sum(ibus) / len(ibus), 1) if ibus else 0,
            'srm': round(sum(srms) / len(srms), 1) if srms else 0
        },
        'ranges': {
            'abv': {'min': min(abvs) if abvs else 0, 'max': max(abvs) if abvs else 0},
            'ibu': {'min': min(ibus) if ibus else 0, 'max': max(ibus) if ibus else 0},
            'srm': {'min': min(srms) if srms else 0, 'max': max(srms) if srms else 0}
        },
        'preferences': {
            'hop_forward': len([r for r in recipes if r.get('ibu', 0) > 40]),
            'high_alcohol': len([r for r in recipes if r.get('abv', 0) > 6.5]),
            'dark_beers': len([r for r in recipes if r.get('srm', 0) > 20])
        }
    }
    
    return insights

if __name__ == '__main__':
    # Test
    scraper = BrewersFriendScraper('384964')
    recipes = scraper.get_recipes()
    
    if recipes:
        # Guardar recetas
        with open('data/my_recipes.json', 'w') as f:
            json.dump(recipes, f, indent=2, ensure_ascii=False)
        
        print(f"\n✅ Guardadas {len(recipes)} recetas en data/my_recipes.json")
        
        # Generar insights
        insights = generate_insights(recipes)
        with open('data/recipe_insights.json', 'w') as f:
            json.dump(insights, f, indent=2, ensure_ascii=False)
        
        print("\n📊 INSIGHTS DE TUS RECETAS:")
        print(f"Total recetas: {insights['total_recipes']}")
        print(f"\n🏆 Top 5 estilos:")
        for style, count in insights['styles']['most_common'][:5]:
            print(f"  - {style}: {count} recetas")
        print(f"\n📈 Promedios:")
        print(f"  - ABV: {insights['averages']['abv']}%")
        print(f"  - IBU: {insights['averages']['ibu']}")
        print(f"  - SRM: {insights['averages']['srm']}")
    else:
        print("❌ No se pudieron obtener recetas")
