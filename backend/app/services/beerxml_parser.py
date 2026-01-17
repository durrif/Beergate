"""BeerXML parser for recipe import."""
import xml.etree.ElementTree as ET
from typing import Dict, List, Optional


def parse_beerxml(xml_content: str) -> Dict:
    """Parse BeerXML format and extract recipe data."""
    try:
        root = ET.fromstring(xml_content)
        recipe_elem = root.find('RECIPE')
        
        if recipe_elem is None:
            raise ValueError("No RECIPE element found in BeerXML")
        
        recipe_data = {
            'name': _get_text(recipe_elem, 'NAME'),
            'type': _get_text(recipe_elem, 'TYPE'),
            'brewer': _get_text(recipe_elem, 'BREWER'),
            'batch_size': _get_float(recipe_elem, 'BATCH_SIZE'),
            'boil_size': _get_float(recipe_elem, 'BOIL_SIZE'),
            'boil_time': _get_float(recipe_elem, 'BOIL_TIME'),
            'efficiency': _get_float(recipe_elem, 'EFFICIENCY'),
            'og': _get_float(recipe_elem, 'OG'),
            'fg': _get_float(recipe_elem, 'FG'),
            'ibu': _get_float(recipe_elem, 'IBU'),
            'abv': _get_float(recipe_elem, 'ABV'),
            'est_color': _get_float(recipe_elem, 'EST_COLOR'),
            'notes': _get_text(recipe_elem, 'NOTES'),
        }
        
        # Extract style
        style_elem = recipe_elem.find('STYLE')
        if style_elem is not None:
            recipe_data['style'] = {
                'name': _get_text(style_elem, 'NAME'),
                'category': _get_text(style_elem, 'CATEGORY'),
                'category_number': _get_text(style_elem, 'CATEGORY_NUMBER'),
                'style_letter': _get_text(style_elem, 'STYLE_LETTER'),
                'style_guide': _get_text(style_elem, 'STYLE_GUIDE')
            }
            
            # Build BJCP style code if available
            cat_num = recipe_data['style'].get('category_number')
            style_letter = recipe_data['style'].get('style_letter')
            if cat_num and style_letter:
                recipe_data['style_bjcp'] = f"{cat_num}{style_letter}"
        
        # Extract fermentables (malts, sugars, etc.)
        recipe_data['fermentables'] = []
        fermentables_elem = recipe_elem.find('FERMENTABLES')
        if fermentables_elem is not None:
            for fermentable in fermentables_elem.findall('FERMENTABLE'):
                recipe_data['fermentables'].append({
                    'name': _get_text(fermentable, 'NAME'),
                    'type': _get_text(fermentable, 'TYPE'),
                    'amount': _get_float(fermentable, 'AMOUNT'),
                    'yield': _get_float(fermentable, 'YIELD'),
                    'color': _get_float(fermentable, 'COLOR'),
                    'add_after_boil': _get_bool(fermentable, 'ADD_AFTER_BOIL'),
                    'origin': _get_text(fermentable, 'ORIGIN'),
                })
        
        # Extract hops
        recipe_data['hops'] = []
        hops_elem = recipe_elem.find('HOPS')
        if hops_elem is not None:
            for hop in hops_elem.findall('HOP'):
                recipe_data['hops'].append({
                    'name': _get_text(hop, 'NAME'),
                    'amount': _get_float(hop, 'AMOUNT'),
                    'alpha': _get_float(hop, 'ALPHA'),
                    'use': _get_text(hop, 'USE'),  # Boil, Dry Hop, First Wort, etc.
                    'time': _get_float(hop, 'TIME'),
                    'form': _get_text(hop, 'FORM'),  # Pellet, Plug, Leaf
                    'origin': _get_text(hop, 'ORIGIN'),
                })
        
        # Extract yeasts
        recipe_data['yeasts'] = []
        yeasts_elem = recipe_elem.find('YEASTS')
        if yeasts_elem is not None:
            for yeast in yeasts_elem.findall('YEAST'):
                recipe_data['yeasts'].append({
                    'name': _get_text(yeast, 'NAME'),
                    'type': _get_text(yeast, 'TYPE'),  # Ale, Lager, Wheat, Wine, Champagne
                    'form': _get_text(yeast, 'FORM'),  # Liquid, Dry, Slant, Culture
                    'amount': _get_float(yeast, 'AMOUNT'),
                    'laboratory': _get_text(yeast, 'LABORATORY'),
                    'product_id': _get_text(yeast, 'PRODUCT_ID'),
                    'min_temperature': _get_float(yeast, 'MIN_TEMPERATURE'),
                    'max_temperature': _get_float(yeast, 'MAX_TEMPERATURE'),
                    'attenuation': _get_float(yeast, 'ATTENUATION'),
                })
        
        # Extract miscs (spices, finings, etc.)
        recipe_data['miscs'] = []
        miscs_elem = recipe_elem.find('MISCS')
        if miscs_elem is not None:
            for misc in miscs_elem.findall('MISC'):
                recipe_data['miscs'].append({
                    'name': _get_text(misc, 'NAME'),
                    'type': _get_text(misc, 'TYPE'),
                    'use': _get_text(misc, 'USE'),
                    'amount': _get_float(misc, 'AMOUNT'),
                    'time': _get_float(misc, 'TIME'),
                })
        
        # Extract mash steps
        recipe_data['mash_steps'] = []
        mash_elem = recipe_elem.find('MASH')
        if mash_elem is not None:
            mash_steps_elem = mash_elem.find('MASH_STEPS')
            if mash_steps_elem is not None:
                for step in mash_steps_elem.findall('MASH_STEP'):
                    recipe_data['mash_steps'].append({
                        'name': _get_text(step, 'NAME'),
                        'type': _get_text(step, 'TYPE'),
                        'step_temp': _get_float(step, 'STEP_TEMP'),
                        'step_time': _get_float(step, 'STEP_TIME'),
                    })
        
        return recipe_data
        
    except ET.ParseError as e:
        raise ValueError(f"Invalid BeerXML format: {e}")


def _get_text(element: ET.Element, tag: str, default: str = "") -> str:
    """Safely extract text from XML element."""
    child = element.find(tag)
    return child.text if child is not None and child.text else default


def _get_float(element: ET.Element, tag: str, default: float = 0.0) -> float:
    """Safely extract float from XML element."""
    text = _get_text(element, tag)
    try:
        return float(text) if text else default
    except ValueError:
        return default


def _get_bool(element: ET.Element, tag: str, default: bool = False) -> bool:
    """Safely extract boolean from XML element."""
    text = _get_text(element, tag).upper()
    if text in ('TRUE', '1', 'YES'):
        return True
    elif text in ('FALSE', '0', 'NO'):
        return False
    return default


def normalize_hop_use(use: str) -> str:
    """Normalize hop use timing to standard values."""
    use_upper = use.upper()
    mapping = {
        'BOIL': 'boil',
        'DRY HOP': 'dry_hop',
        'DRY HOPPING': 'dry_hop',
        'FIRST WORT': 'first_wort',
        'WHIRLPOOL': 'whirlpool',
        'HOP STAND': 'whirlpool',
        'AROMA': 'aroma',
    }
    return mapping.get(use_upper, 'boil')


def normalize_fermentable_type(ferm_type: str) -> str:
    """Normalize fermentable type to category."""
    ferm_upper = ferm_type.upper()
    if 'GRAIN' in ferm_upper or 'MALT' in ferm_upper:
        return 'malt'
    elif 'SUGAR' in ferm_upper or 'HONEY' in ferm_upper:
        return 'adjunct'
    elif 'EXTRACT' in ferm_upper:
        return 'adjunct'
    return 'other'
