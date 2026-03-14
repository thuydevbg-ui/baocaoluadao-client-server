import { NextRequest } from 'next/server';
import { POST as lookupPOST } from '../src/app/api/lookup/route';
import { GET as blacklistGET } from '../src/app/api/blacklist/route';
import { GET as userReportsGET, POST as userReportsPOST } from '../src/app/api/user/reports/route';
import { GET as userReportDetailGET, DELETE as userReportDELETE } from '../src/app/api/user/reports/[id]/route';
import { GET as watchlistGET, POST as watchlistPOST } from '../src/app/api/user/watchlist/route';
import { DELETE as watchlistDELETE } from '../src/app/api/user/watchlist/[id]/route';
import { GET as alertsGET } from '../src/app/api/user/alerts/route';
import { GET as evidenceGET, POST as evidencePOST } from '../src/app/api/user/evidence/route';

const testEmail = process.env.TEST_EMAIL || 'test@local';
const allowImpersonate = process.env.ALLOW_TEST_IMPERSONATION === '1';

function makeReq(url: string, init?: RequestInit) {
  const headers = new Headers(init?.headers || {});
  if (allowImpersonate) headers.set('x-test-user-email', testEmail);
  return new NextRequest(url, { ...init, headers });
}

async function testLookup() {
  const req = makeReq('http://localhost/api/lookup', {
    method: 'POST',
    body: JSON.stringify({ query: '0987654321', kind: 'phone' }),
    headers: new Headers({ 'content-type': 'application/json' }),
  });
  const res = await lookupPOST(req);
  const json = await res.json();
  console.log('Lookup response:', json);
}

async function testBlacklist() {
  const req = makeReq('http://localhost/api/blacklist?limit=2', { method: 'GET' });
  const res = await blacklistGET(req);
  const json = await res.json();
  console.log('Blacklist response:', json);
}

async function testWatchlist() {
  const addReq = makeReq('http://localhost/api/user/watchlist', {
    method: 'POST',
    body: JSON.stringify({ target: '0987654321', type: 'phone' }),
    headers: new Headers({ 'content-type': 'application/json' }),
  });
  const addRes = await watchlistPOST(addReq);
  const addJson = await addRes.json();
  console.log('Watchlist add:', addJson);

  const listReq = makeReq('http://localhost/api/user/watchlist', { method: 'GET' });
  const listRes = await watchlistGET(listReq);
  const listJson = await listRes.json();
  console.log('Watchlist list:', listJson);

  if (addJson.id) {
    const delReq = makeReq(`http://localhost/api/user/watchlist/${addJson.id}`, { method: 'DELETE' });
    const delRes = await watchlistDELETE(delReq, { params: Promise.resolve({ id: addJson.id }) } as any);
    const delJson = await delRes.json();
    console.log('Watchlist delete:', delJson);
  }
}

async function testUserReports(options: { keep?: boolean } = {}) {
  const createReq = makeReq('http://localhost/api/user/reports', {
    method: 'POST',
    body: JSON.stringify({ type: 'phone', target: '0987654321', riskScore: 80 }),
    headers: new Headers({ 'content-type': 'application/json' }),
  });
  const createRes = await userReportsPOST(createReq);
  const created = await createRes.json();
  console.log('User report created:', created);

  const listReq = makeReq('http://localhost/api/user/reports', { method: 'GET' });
  const listRes = await userReportsGET(listReq);
  const listJson = await listRes.json();
  console.log('User report list:', listJson);

  if (created.id) {
    const detailReq = makeReq(`http://localhost/api/user/reports/${created.id}`, { method: 'GET' });
    const detailRes = await userReportDetailGET(detailReq, { params: Promise.resolve({ id: created.id }) } as any);
    const detailJson = await detailRes.json();
    console.log('User report detail:', detailJson);

    if (!options.keep) {
      const delReq = makeReq(`http://localhost/api/user/reports/${created.id}`, { method: 'DELETE' });
      const delRes = await userReportDELETE(delReq, { params: Promise.resolve({ id: created.id }) } as any);
      const delJson = await delRes.json();
      console.log('User report delete:', delJson);
    }
  }
  return created;
}

async function testAlerts() {
  const req = makeReq('http://localhost/api/user/alerts', { method: 'GET' });
  const res = await alertsGET(req);
  const json = await res.json();
  console.log('Alerts:', json);
}

async function testEvidence(reportId: string) {
  const uploadReq = makeReq('http://localhost/api/user/evidence', {
    method: 'POST',
    body: JSON.stringify({
      reportId,
      fileUrl: 'https://example.com/evidence.png',
      mime: 'image/png',
      sizeBytes: 1234,
      sha256: 'mockhash',
    }),
    headers: new Headers({ 'content-type': 'application/json' }),
  });
  const uploadRes = await evidencePOST(uploadReq);
  const uploadJson = await uploadRes.json();
  console.log('Evidence upload:', uploadJson);

  const listReq = makeReq(`http://localhost/api/user/evidence?reportId=${reportId}`, { method: 'GET' });
  const listRes = await evidenceGET(listReq);
  const listJson = await listRes.json();
  console.log('Evidence list:', listJson);
}

(async () => {
  const useMock = process.env.MOCK_DB === '1';
  const canAuth = useMock || allowImpersonate;
  await testLookup();
  await testBlacklist();
  if (canAuth) {
    const created = await testUserReports({ keep: true });
    const reportId = created?.id || 'RPT-MOCK-1';
    await testWatchlist();
    await testAlerts();
    await testEvidence(reportId);
    // cleanup report
    if (created?.id) {
      const delReq = makeReq(`http://localhost/api/user/reports/${created.id}`, { method: 'DELETE' });
      await userReportDELETE(delReq, { params: Promise.resolve({ id: created.id }) } as any);
    }
  } else {
    console.log('Skipped user reports/watchlist/alerts/evidence tests (need authenticated session) when MOCK_DB is disabled.');
  }
})();
