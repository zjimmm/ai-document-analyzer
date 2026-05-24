def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_notify_completed(client):
    response = client.post("/notify", json={
        "documentId": "123e4567-e89b-12d3-a456-426614174000",
        "fileName": "invoice.pdf",
        "status": "COMPLETED",
        "summary": "Invoice from ABC Corp for $1500",
    })
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_notify_failed(client):
    response = client.post("/notify", json={
        "documentId": "123e4567-e89b-12d3-a456-426614174001",
        "fileName": "report.pdf",
        "status": "FAILED",
        "summary": None,
    })
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_notify_missing_fields(client):
    response = client.post("/notify", json={
        "fileName": "invoice.pdf",
        "status": "COMPLETED",
    })
    assert response.status_code == 422
