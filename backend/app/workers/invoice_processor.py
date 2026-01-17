"""Invoice processing tasks."""
from app.workers.celery_app import celery_app
import pdfplumber
import re
from decimal import Decimal


@celery_app.task(name="app.workers.invoice_processor.process_invoice")
def process_invoice(purchase_id: str):
    """Process invoice PDF and extract data."""
    # TODO: Implement full invoice processing
    # 1. Load purchase from DB
    # 2. Extract text from PDF with pdfplumber
    # 3. Parse with regex
    # 4. Create purchase items
    # 5. Match with ML embeddings
    # 6. Update purchase status
    
    print(f"Processing invoice for purchase {purchase_id}")
    return {"status": "completed", "purchase_id": purchase_id}


def extract_text_from_pdf(file_path: str) -> str:
    """Extract text from PDF file."""
    text = ""
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            text += page.extract_text() or ""
    return text


def parse_invoice_text(text: str) -> dict:
    """Parse invoice text to extract structured data."""
    # TODO: Implement regex patterns for common suppliers
    # Castle Malting, Bestmalz, etc.
    
    data = {
        "supplier": None,
        "date": None,
        "invoice_number": None,
        "items": []
    }
    
    # Example regex patterns (customize per supplier)
    supplier_pattern = r"(?:Supplier|Proveedor):?\s*(.+)"
    date_pattern = r"(?:Date|Fecha):?\s*(\d{2}/\d{2}/\d{4})"
    invoice_pattern = r"(?:Invoice|Factura)\s*(?:Number|Nº|#):?\s*(\S+)"
    
    supplier_match = re.search(supplier_pattern, text, re.IGNORECASE)
    if supplier_match:
        data["supplier"] = supplier_match.group(1).strip()
    
    date_match = re.search(date_pattern, text)
    if date_match:
        data["date"] = date_match.group(1)
    
    invoice_match = re.search(invoice_pattern, text, re.IGNORECASE)
    if invoice_match:
        data["invoice_number"] = invoice_match.group(1)
    
    # Parse line items (example pattern)
    # "Pale Malt 25kg 2 50.00 100.00"
    item_pattern = r"(.+?)\s+(\d+(?:\.\d+)?)\s*(?:kg|g|L|units?)\s+(\d+)\s+(\d+\.\d{2})\s+(\d+\.\d{2})"
    
    for match in re.finditer(item_pattern, text):
        data["items"].append({
            "product_name": match.group(1).strip(),
            "unit_size": match.group(2),
            "quantity": int(match.group(3)),
            "unit_price": Decimal(match.group(4)),
            "total_price": Decimal(match.group(5))
        })
    
    return data
