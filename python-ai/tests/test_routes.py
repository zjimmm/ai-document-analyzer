import base64
from unittest.mock import patch


def test_health_returns_ok(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_analyze_returns_structured_response(client):
    fake_result = {
        "summary": "Invoice from Test Corp",
        "extractedText": "Invoice #1234 from Test Corp",
        "structuredData": {"vendorName": "Test Corp", "amount": 500},
    }
    with patch("app.api.routes.analyze_document", return_value=fake_result):
        response = client.post("/analyze", json={
            "fileContent": base64.b64encode(b"fake pdf bytes").decode(),
            "fileName": "invoice.pdf",
            "fileType": "application/pdf",
        })

    assert response.status_code == 200
    data = response.json()
    assert data["summary"] == "Invoice from Test Corp"
    assert data["structuredData"]["vendorName"] == "Test Corp"


def test_analyze_returns_500_on_error(client):
    with patch("app.api.routes.analyze_document", side_effect=Exception("Gemini unavailable")):
        response = client.post("/analyze", json={
            "fileContent": base64.b64encode(b"fake pdf bytes").decode(),
            "fileName": "invoice.pdf",
            "fileType": "application/pdf",
        })

    assert response.status_code == 500
