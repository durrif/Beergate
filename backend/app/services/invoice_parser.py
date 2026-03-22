# backend/app/services/invoice_parser.py
"""
Parse beer ingredient invoices from PDF files using pdfplumber + regex.
Extracts: supplier name, invoice number, line items (ingredient, quantity, unit, price).
"""
import io
import re
from typing import Any

try:
    import pdfplumber
    PDFPLUMBER_AVAILABLE = True
except ImportError:
    PDFPLUMBER_AVAILABLE = False


# Regex patterns for Spanish/European beer shop invoices
_PATTERNS = {
    "supplier": re.compile(r'(?:De|Proveedor|Empresa|From):\s*(.+?)(?:\n|$)', re.IGNORECASE),
    "invoice_number": re.compile(r'(?:Factura|Invoice|Ref|N[úu]mero)\s*[#:\.\s]*([A-Z0-9\-/]+)', re.IGNORECASE),
    "total": re.compile(r'(?:Total|TOTAL|Importe\s+total)[:\s]*([0-9]+[.,][0-9]{2})\s*€?', re.IGNORECASE),
    # Item line: "Malta Pale Ale  5,00 kg  2,50€/kg  12,50€"
    "item": re.compile(
        r'(?P<name>[A-Za-záéíóúüñÁÉÍÓÚÜÑ][A-Za-záéíóúüñÁÉÍÓÚÜÑ\s\-\.]+?)'
        r'\s+(?P<qty>[0-9]+[.,]?[0-9]*)\s*(?P<unit>kg|g|l|ml|pkt|unid|un|paquete)?'
        r'(?:\s+[0-9]+[.,][0-9]{2}\s*€?/[a-z]+)?'
        r'\s+(?P<total>[0-9]+[.,][0-9]{2})\s*€?',
        re.IGNORECASE | re.MULTILINE,
    ),
}

# Known ingredient keywords to filter item lines
_INGREDIENT_KEYWORDS = (
    'malta', 'malt', 'lúpulo', 'lupulo', 'hop', 'levadura', 'yeast',
    'adjunto', 'trigo', 'avena', 'maíz', 'cebada', 'centeno',
)


def _parse_text(text: str) -> dict[str, Any]:
    result: dict[str, Any] = {"supplier": None, "invoice_number": None, "total_amount": None, "currency": "EUR", "items": []}

    m = _PATTERNS["supplier"].search(text)
    if m:
        result["supplier"] = m.group(1).strip()[:255]

    m = _PATTERNS["invoice_number"].search(text)
    if m:
        result["invoice_number"] = m.group(1).strip()[:100]

    m = _PATTERNS["total"].search(text)
    if m:
        try:
            result["total_amount"] = float(m.group(1).replace(',', '.'))
        except ValueError:
            pass

    for m in _PATTERNS["item"].finditer(text):
        name = m.group("name").strip()
        # Only include if the line looks like an ingredient
        name_lower = name.lower()
        if not any(kw in name_lower for kw in _INGREDIENT_KEYWORDS):
            continue
        try:
            qty = float(m.group("qty").replace(',', '.'))
        except (ValueError, AttributeError):
            qty = 0.0
        unit = (m.group("unit") or "kg").lower()
        # Normalise unit
        unit_map = {"unid": "unit", "un": "unit", "paquete": "pkt"}
        unit = unit_map.get(unit, unit)
        try:
            total_price = float(m.group("total").replace(',', '.'))
        except (ValueError, AttributeError):
            total_price = None

        if qty > 0:
            result["items"].append({
                "name": name[:255],
                "quantity": qty,
                "unit": unit,
                "unit_price": round(total_price / qty, 4) if total_price and qty else None,
                "total_price": total_price,
            })

    return result


async def parse_invoice_pdf(content: bytes, filename: str = "invoice.pdf") -> dict[str, Any]:
    """
    Parse a PDF invoice. Returns a dict with supplier, invoice_number,
    total_amount, currency, and items list.
    """
    if not PDFPLUMBER_AVAILABLE:
        return {"supplier": None, "invoice_number": None, "total_amount": None, "currency": "EUR", "items": []}

    text_parts: list[str] = []
    with pdfplumber.open(io.BytesIO(content)) as pdf:
        for page in pdf.pages:
            extracted = page.extract_text()
            if extracted:
                text_parts.append(extracted)

    full_text = "\n".join(text_parts)
    return _parse_text(full_text)
