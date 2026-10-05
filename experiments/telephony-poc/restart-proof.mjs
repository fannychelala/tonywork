// Synthetic verification tool, executed inside the private POC container only.
import assert from 'node:assert/strict';
import { Pool } from 'pg';
import twilio from 'twilio';
const phase = process.argv[2];
assert(['before','after'].includes(phase));
const pool = new Pool({connectionString:process.env.POC_DATABASE_URL,connectionTimeoutMillis:2000});
try {
 const operation = await pool.query('SELECT resource FROM "PocOperation" WHERE id=$1',['00000000-0000-4000-8000-000000000001']);
 const resource = operation.rows[0]?.resource;
 assert.match(resource,/^CA[0-9a-f]{32}$/);
 const count = async()=>Number((await pool.query('SELECT count(*) FROM "PocWebhookReceipt"')).rows[0].count);
 assert.equal(await count(),phase==='before'?0:1);
 const url='http://127.0.0.1:4315/poc/webhooks/twilio/call-status';
 const fields={AccountSid:'AC'+'0'.repeat(32),CallSid:resource,CallStatus:'completed',SequenceNumber:'3'};
 const signature=twilio.getExpectedTwilioSignature('synthetic-poc-signature-key-not-a-credential',url,fields);
 const response=await fetch(url,{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded','x-twilio-signature':signature},body:new URLSearchParams(fields).toString()});
 assert.equal(response.status,204);
 assert.equal(await count(),1);
 assert.equal(Number((await pool.query('SELECT count(*) FROM "PocOperation"')).rows[0].count),1);
 console.log(phase==='before'?'SYNTHETIC_RECEIPT_COMMITTED':'SYNTHETIC_REPLAY_DEDUPLICATED_AFTER_FULL_RESTART');
} finally {await pool.end();}
