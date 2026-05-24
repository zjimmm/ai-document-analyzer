def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_export_completed(client):
    payload = {
        "fileName": "invoice.pdf",
        "status": "COMPLETED",
        "summary": "Invoice from ABC Corp",
        "extractedText": "Invoice #1234 Total: $1500",
        "structuredData": {"vendorName": "ABC Corp", "amount": 1500},
    }
    response = client.post("/export", json=payload)
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert len(response.content) > 0


def test_export_non_completed_status(client):
    payload = {
        "fileName": "invoice.pdf",
        "status": "PROCESSING",
        "summary": None,
        "extractedText": None,
        "structuredData": None,
    }
    response = client.post("/export", json=payload)
    assert response.status_code == 422


def test_export_missing_fields(client):
    payload = {
        "status": "COMPLETED",
    }
    response = client.post("/export", json=payload)
    assert response.status_code == 422
