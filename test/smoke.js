'use strict';

const { spawn } = require('child_process');
const { io } = require('socket.io-client');
const assert = require('assert');

const PORT = 3107;
const URL = `http://127.0.0.1:${PORT}`;
const sleep = ms => new Promise(r => setTimeout(r, ms));

function emitAck(client, event, payload = {}) {
  return new Promise(resolve => client.emit(event, payload, resolve));
}

async function waitFor(getValue, predicate, label, timeout = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const value = getValue();
    if (value && predicate(value)) return value;
    await sleep(60);
  }
  throw new Error(`Timeout waiting for ${label}`);
}

async function main() {
  let server;
  const clients = [];
  try {
    server = spawn(process.execPath, ['server.js'], {
      cwd: process.cwd(),
      env: { ...process.env, PORT: String(PORT) },
      stdio: ['ignore', 'pipe', 'pipe']
    });
    server.stderr.on('data', d => process.stderr.write(d));
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Server did not start')), 8000);
      server.stdout.on('data', d => {
        if (String(d).includes('attivo')) { clearTimeout(timer); resolve(); }
      });
      server.once('exit', code => reject(new Error(`Server exited ${code}`)));
    });

    const latest = Array(5).fill(null);
    for (let i = 0; i < 5; i += 1) {
      const client = io(URL, { transports: ['websocket'] });
      client.on('roomState', s => { latest[i] = s; });
      clients.push(client);
    }
    await Promise.all(clients.map(c => new Promise(resolve => c.on('connect', resolve))));

    const created = await emitAck(clients[0], 'createRoom', { name: 'Host', settings: { hostPlays: true } });
    assert.equal(created.ok, true);
    const code = created.code;

    for (let i = 1; i < clients.length; i += 1) {
      const joined = await emitAck(clients[i], 'joinRoom', { code, name: `Player${i}` });
      assert.equal(joined.ok, true);
      const ready = await emitAck(clients[i], 'setReady', true);
      assert.equal(ready.ok, true);
    }

    const lobby = await waitFor(() => latest[0], s => s.phase === 'lobby' && s.players.length === 5 && s.canStart, 'ready lobby');
    assert.equal(lobby.isHost, true);
    assert.equal(lobby.players.some(p => p.role), false, 'roles leaked in lobby');

    const started = await emitAck(clients[0], 'startGame');
    assert.equal(started.ok, true);
    await waitFor(() => latest.every(s => s?.phase === 'roleReveal' && s.me?.role), Boolean, 'role reveal for all');
    const roleStates = latest.slice();
    assert.equal(roleStates.filter(s => s.me.role.key === 'lupo').length >= 1, true);
    for (const s of roleStates) assert.equal(s.players.some(p => p.role), false, 'role map leaked before end');

    const firstNight = await emitAck(clients[0], 'beginFirstNight');
    assert.equal(firstNight.ok, true);
    await waitFor(() => latest[0], s => s.phase === 'night' && s.nightStep, 'first night step');

    let safety = 0;
    let previousStepKey = '';
    while (safety++ < 14) {
      const hostState = latest[0];
      if (hostState.phase === 'dayDiscussion' || hostState.phase === 'ended') break;
      assert.equal(hostState.phase, 'night');
      const stepKey = `${hostState.day}:${hostState.nightStep}`;
      if (!hostState.nightStep || stepKey === previousStepKey) {
        await sleep(120);
        continue;
      }
      previousStepKey = stepKey;
      const actors = latest.map((s, i) => ({ s, i })).filter(x => x.s?.me?.nightPrompt && !x.s.me.nightPrompt.submitted);
      assert(actors.length >= 1, `no actor for ${hostState.nightStep}`);
      for (const { s, i } of actors) {
        const prompt = s.me.nightPrompt;
        const payload = prompt.type === 'witch'
          ? { save: false, poisonTarget: null }
          : { targetId: prompt.targets[0].id };
        const action = await emitAck(clients[i], 'submitNightAction', payload);
        assert.equal(action.ok, true, `${hostState.nightStep} action failed`);
      }
      await waitFor(() => latest[0], s => s.phase !== 'night' || `${s.day}:${s.nightStep}` !== stepKey, `advance from ${stepKey}`, 10000);
    }

    const day = await waitFor(() => latest[0], s => ['dayDiscussion', 'ended'].includes(s.phase), 'dawn');
    if (day.phase !== 'ended') {
      const openVote = await emitAck(clients[0], 'startVoting');
      assert.equal(openVote.ok, true);
      await waitFor(() => latest.every(s => s?.phase === 'voting'), Boolean, 'voting open');
      for (let i = 0; i < clients.length; i += 1) {
        const s = latest[i];
        if (!s.me.alive) continue;
        const target = s.votingTargets[0];
        assert(target, 'missing voting target');
        const vote = await emitAck(clients[i], 'submitVote', { targetId: target.id });
        assert.equal(vote.ok, true);
      }
      await waitFor(() => latest[0], s => ['dayResult', 'ended'].includes(s.phase), 'vote result');
    }

    console.log('Smoke test passed: room, secrecy, roles, night actions and vote.');
  } finally {
    for (const c of clients) c.close();
    if (server && !server.killed) server.kill('SIGTERM');
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
