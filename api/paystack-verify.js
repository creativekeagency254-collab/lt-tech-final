const PAYSTACK_VERIFY_BASE = 'https://api.paystack.co/transaction/verify/';

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function normalizeReference(raw) {
  return String(raw || '').trim();
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }
  if (req.method !== 'POST') {
    json(res, 405, { ok: false, error: 'Method not allowed. Use POST.' });
    return;
  }

  const paystackSecret = String(process.env.PAYSTACK_SECRET_KEY || '').trim();
  if (!/^sk_(test|live)_/i.test(paystackSecret)) {
    json(res, 500, { ok: false, error: 'PAYSTACK_SECRET_KEY is missing or invalid on server.' });
    return;
  }

  let payload = {};
  try {
    payload = req.body && typeof req.body === 'object' ? req.body : JSON.parse(req.body || '{}');
  } catch (_) {
    json(res, 400, { ok: false, error: 'Invalid JSON payload.' });
    return;
  }

  const reference = normalizeReference(payload.reference);
  const expectedAmount = Number(payload.expectedAmount || 0);
  const expectedCurrency = String(payload.expectedCurrency || 'KES').trim().toUpperCase();

  if (!reference) {
    json(res, 400, { ok: false, error: 'reference is required.' });
    return;
  }

  try {
    const response = await fetch(`${PAYSTACK_VERIFY_BASE}${encodeURIComponent(reference)}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${paystackSecret}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      json(res, 502, { ok: false, error: data?.message || 'Paystack verification failed at gateway.' });
      return;
    }

    const tx = data?.data || {};
    const paid = data?.status === true && tx?.status === 'success';
    if (!paid) {
      json(res, 400, { ok: false, error: tx?.gateway_response || 'Transaction not successful.' });
      return;
    }

    const amountMatches = !expectedAmount || Number(tx.amount || 0) === expectedAmount;
    const currencyMatches = !expectedCurrency || String(tx.currency || '').toUpperCase() === expectedCurrency;
    if (!amountMatches || !currencyMatches) {
      json(res, 400, {
        ok: false,
        error: 'Transaction verification mismatch.',
        details: {
          expectedAmount,
          receivedAmount: Number(tx.amount || 0),
          expectedCurrency,
          receivedCurrency: String(tx.currency || '').toUpperCase(),
        },
      });
      return;
    }

    json(res, 200, {
      ok: true,
      verified: true,
      reference: String(tx.reference || reference),
      amount: Number(tx.amount || 0),
      currency: String(tx.currency || '').toUpperCase(),
      status: String(tx.status || ''),
      paidAt: tx.paid_at || null,
      channel: tx.channel || null,
    });
  } catch (error) {
    json(res, 500, { ok: false, error: error?.message || 'Unexpected verification error.' });
  }
};

