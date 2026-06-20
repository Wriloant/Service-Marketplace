"""
Mock payment gateway — a self-contained sandbox, no real money, no external call.

It mimics the shape of a real test gateway (Stripe/SSLCommerz style): you pass a
card token, it returns a gateway reference and a success/failure status with a
raw payload that we persist on the Transaction row.

Deterministic test tokens so a demo can show BOTH outcomes:
    tok_success  / tok_visa   -> success
    tok_fail     / tok_decline-> declined
    anything else             -> success (default-happy sandbox)
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

FAIL_TOKENS = {"tok_fail", "tok_decline"}


def charge(amount: float, card_token: str) -> dict:
    """Simulate a sandbox charge. Returns a gateway response dict."""
    ref = "txn_" + uuid.uuid4().hex[:18]
    declined = card_token in FAIL_TOKENS
    return {
        "gateway": "sandbox",
        "gateway_ref": ref,
        "status": "failed" if declined else "success",
        "amount": amount,
        "card_token": card_token,
        "processed_at": datetime.now(timezone.utc).isoformat(),
        "message": "Card declined (sandbox)" if declined else "Payment approved (sandbox)",
    }
