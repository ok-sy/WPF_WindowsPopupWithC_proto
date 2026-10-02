// Run after Popup.BehaviorTests: execute the actual generated HTML's script against a video/WebView bridge double.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
let checks = 0;
const htmlDirectory = process.argv[2] || path.join(__dirname, 'bin/Debug/net10.0-windows');
function check(condition, message) { assert.ok(condition, message); checks++; }

async function main() {
  for (const allowRate of [false, true]) {
    const html = fs.readFileSync(path.join(htmlDirectory, `video-controls-${allowRate ? 'True' : 'False'}.html`), 'utf8');
    const listeners = new Map();
    const messages = [];
    let command;
    let rate = 1;
    const video = {
      duration: 100, currentTime: 0, paused: true, ended: false, seeking: false, volume: 1,
      addEventListener(type, callback) {
        if (!listeners.has(type)) listeners.set(type, []);
        listeners.get(type).push(callback);
      },
      emit(type) { for (const callback of listeners.get(type) || []) callback(); },
      play() { this.paused = false; this.emit('play'); return Promise.resolve(); },
      pause() { this.paused = true; this.emit('pause'); },
      get playbackRate() { return rate; },
      set playbackRate(value) { rate = value; this.emit('ratechange'); }
    };
    vm.runInNewContext(html.match(/<script>([\s\S]*?)<\/script>/)[1], {
      document: { getElementById: () => video },
      chrome: { webview: { postMessage: message => messages.push(message), addEventListener: (type, callback) => { command = callback; } } }
    });
    const send = (name, value = 0) => command({ data: { command: name, value } });
    check(video.volume === .35, 'default volume is applied to HTML5 engine');
    video.emit('loadedmetadata');
    check(messages.at(-1).type === 'opened' && messages.at(-1).duration === 100, 'metadata crosses bridge');
    video.emit('canplay');
    check(video.paused && messages.at(-1).type === 'ready', 'autoplay=false remains paused when playable');
    send('play');
    check(!video.paused && messages.at(-1).type === 'play', 'WPF play command reaches engine');
    send('pause');
    check(video.paused && messages.at(-1).paused, 'WPF pause command returns paused state');
    send('seek', 50);
    check(video.currentTime === 50 && messages.at(-1).type === 'seeking', 'WPF seek updates engine and reports seeking');
    send('seek', 50);
    check(messages.at(-1).type === 'seeked', 'unchanged seek acknowledges completion');
    send('volume', 0);
    check(video.volume === 0, 'mute command updates engine');
    send('volume', .35);
    check(video.volume === .35, 'unmute restores requested volume');
    send('rate', 2);
    check(video.playbackRate === (allowRate ? 2 : 1), 'WPF rate respects policy');
    video.playbackRate = 1.5;
    check(video.playbackRate === (allowRate ? 1.5 : 1), 'external rate changes respect policy');
    for (const type of ['timeupdate', 'seeking', 'seeked', 'waiting', 'stalled', 'playing', 'ended', 'error', 'volumechange']) {
      video.emit(type);
      check(messages.at(-1).type === (type === 'timeupdate' ? 'progress' : type), type + ' state crosses bridge');
    }
    await assert.rejects(video.requestFullscreen(), /Use WPF fullscreen/);
    checks++;
    video.ended = true;
    video.currentTime = 100;
    send('play');
    check(video.currentTime === 0 && !video.paused, 'replay seeks to beginning');
  }
  const autoplayHtml = fs.readFileSync(path.join(htmlDirectory, 'video-autoplay.html'), 'utf8');
  for (const failure of [null, 'NotAllowedError', 'NotSupportedError', 'AbortError']) {
    const listeners = new Map(), messages = [];
    let command, plays = 0;
    const video = {
      duration: 100, currentTime: 0, paused: true, seeking: false, volume: 1, playbackRate: 1,
      addEventListener(type, callback) { if (!listeners.has(type)) listeners.set(type, []); listeners.get(type).push(callback); },
      emit(type) { for (const callback of listeners.get(type) || []) callback(); },
      play() { plays++; if (failure) return Promise.reject({ name: failure }); this.paused = false; this.emit('play'); return Promise.resolve(); },
      pause() { this.paused = true; this.emit('pause'); }
    };
    vm.runInNewContext(autoplayHtml.match(/<script>([\s\S]*?)<\/script>/)[1], {
      document: { getElementById: () => video },
      chrome: { webview: { postMessage: message => messages.push(message), addEventListener: (type, callback) => { command = callback; } } }
    });
    video.emit('loadstart');
    check(messages.at(-1).type === 'loading', 'initial resource loading is reported');
    video.emit('canplay');
    await Promise.resolve();
    check(plays === 1, 'autoplay explicitly starts once when playable');
    check(messages.at(-1).type === (failure === 'NotAllowedError' ? 'playblocked' : failure === 'NotSupportedError' ? 'error' : failure === 'AbortError' ? 'ready' : 'play'),
      'play promise rejection distinguishes policy, decode failure and canceled play');
    command({ data: { command: 'pause' } });
    video.emit('canplay');
    check(plays === 1 && video.paused, 'later canplay does not undo manual pause');
  }
  console.log(`PASS: ${checks} HTML5 bridge checks`);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
