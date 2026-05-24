from fpdf import FPDF
from fpdf.enums import XPos, YPos

from app.models.schemas import ExportRequest

MARGIN = 15


def _reset(pdf: FPDF) -> None:
    pdf.set_x(MARGIN)


def _section_heading(pdf: FPDF, text: str) -> None:
    _reset(pdf)
    pdf.set_font("Helvetica", style="B", size=13)
    pdf.cell(0, 8, text, new_x=XPos.LMARGIN, new_y=YPos.NEXT)


def _body(pdf: FPDF, text: str) -> None:
    _reset(pdf)
    w = pdf.w - 2 * MARGIN
    pdf.set_font("Helvetica", size=11)
    pdf.multi_cell(w, 6, text)


def build_pdf(request: ExportRequest) -> bytes:
    pdf = FPDF()
    pdf.set_margins(MARGIN, MARGIN, MARGIN)
    pdf.add_page()

    # Title
    _reset(pdf)
    pdf.set_font("Helvetica", style="B", size=18)
    w = pdf.w - 2 * MARGIN
    pdf.multi_cell(w, 10, request.fileName)
    pdf.ln(4)

    # Summary
    _section_heading(pdf, "Summary")
    _body(pdf, request.summary or "No summary available.")
    pdf.ln(4)

    # Structured Data
    if request.structuredData:
        _section_heading(pdf, "Structured Data")
        for key, value in request.structuredData.items():
            _body(pdf, f"{key}: {value}")
        pdf.ln(4)

    # Extracted Text
    if request.extractedText:
        _section_heading(pdf, "Extracted Text")
        _body(pdf, request.extractedText)

    return bytes(pdf.output())
