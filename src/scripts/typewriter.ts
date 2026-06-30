import type { Locale } from '../i18n';

interface InteractiveConfig {
  prelude?: string;
  prompt: string;
  answer: string;
  waitMs?: number;
}

interface Command {
  cmd: string;
  output: string;
  tone?: 'info' | 'success' | 'stack' | 'profile';
  interactive?: InteractiveConfig;
}

type OutputSegment = 'prelude' | 'result' | 'prompt' | 'wait' | 'answer' | 'none';
type OutputStage = 'before' | 'after' | 'done';

const FLAG_MARKER = '{{flag}}';
const FLAG_W = 17;
const FLAG_H = 7;
const FLAG_V_START = 7;
const FLAG_V_END = 9;
const FLAG_H_ROW = 3;

function buildFinlandFlagGrid(): boolean[][] {
  const grid = Array.from({ length: FLAG_H }, () => Array(FLAG_W).fill(false));

  for (let row = 0; row < FLAG_H; row += 1) {
    for (let col = 0; col < FLAG_W; col += 1) {
      const onVertical = col >= FLAG_V_START && col <= FLAG_V_END;
      const onHorizontal = row === FLAG_H_ROW;
      grid[row][col] = onVertical || onHorizontal;
    }
  }

  return grid;
}

const FINLAND_FLAG_GRID = buildFinlandFlagGrid();

function gridToRows(grid: boolean[][]): string[] {
  return grid.map((row) => row.map((cell) => (cell ? 'B' : 'W')).join(''));
}

const FINLAND_FLAG_BASE = gridToRows(FINLAND_FLAG_GRID);

let animationActive = false;
let commandIndex = 0;
let charIndex = 0;
let currentText = '';
let isTypingOutput = false;
let pauseUntil = 0;
let clearing = false;
let outputSegment: OutputSegment = 'none';
let outputStage: OutputStage = 'before';
let outputAfterIndex = 0;
let showGameCursor = false;
let showTypingCursor = false;
let commands: Command[] = [];
let nextCharAt = 0;

const CHAR_DELAY_CMD = 34;
const CHAR_DELAY_OUTPUT = 44;
const CHAR_DELAY_INTERACTIVE = 42;
const CHAR_DELAY_ANSWER = 165;
const PAUSE_BETWEEN_COMMANDS = 3600;
const PAUSE_LAST_COMMAND = 4800;

function charDelay(): number {
  if (outputSegment === 'answer') return CHAR_DELAY_ANSWER;
  if (outputSegment === 'prelude' || outputSegment === 'prompt') return CHAR_DELAY_INTERACTIVE;
  if (!isTypingOutput) return CHAR_DELAY_CMD;
  return CHAR_DELAY_OUTPUT;
}

function scheduleChar(now: number): void {
  nextCharAt = now + charDelay();
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function getOutputParts(output: string): { before: string; after: string; hasFlag: boolean } {
  const idx = output.indexOf(FLAG_MARKER);
  if (idx === -1) {
    return { before: output, after: '', hasFlag: false };
  }

  return {
    before: output.slice(0, idx),
    after: output.slice(idx + FLAG_MARKER.length),
    hasFlag: true,
  };
}

function insertStaticFlag(): void {
  if (!currentText.endsWith('\n')) currentText += '\n';
  currentText += FINLAND_FLAG_BASE.map((row) => `@F:${row}`).join('\n');
}

function formatFlagRow(row: string): string {
  let html = '<span class="tw-flag-row">';

  for (const ch of row) {
    if (ch === 'B') {
      html += '<span class="tw-flag-cell tw-flag-blue"></span>';
    } else {
      html += '<span class="tw-flag-cell tw-flag-white"></span>';
    }
  }

  html += '</span>';
  return html;
}

function formatFlagBlock(rows: string[]): string {
  let html = '<span class="tw-flag-art">';

  for (const row of rows) {
    html += formatFlagRow(row);
  }

  html += '</span>';
  return html;
}

function formatPrompt(cmd: string): string {
  const escaped = escapeHtml(cmd);
  const styled = escaped
    .replace(/(-{1,2}[a-z]+)/g, '<span class="tw-flag">$1</span>')
    .replace(/(\$[A-Z_]+)/g, '<span class="tw-var">$1</span>');

  return `<span class="tw-prompt">$</span> <span class="tw-cmd">${styled}</span>`;
}

function formatInteractiveLine(escaped: string): string {
  return `<span class="tw-interactive">${escaped}</span>`;
}

function formatOutput(output: string, tone?: Command['tone']): string {
  const escaped = escapeHtml(output);

  if (escaped.startsWith('&gt;')) {
    return formatInteractiveLine(escaped);
  }

  switch (tone) {
    case 'success':
      return escaped.replace(/^\[ok\]/, '<span class="tw-ok">[ok]</span>');
    case 'profile':
      if (escaped.includes(':')) {
        const colon = escaped.indexOf(':');
        const label = escaped.slice(0, colon + 1);
        const value = escaped.slice(colon + 1);
        return `<span class="tw-dim">${label}</span><span class="tw-out">${value}</span>`;
      }
      return `<span class="tw-user">${escaped}</span>`;
    case 'stack':
      return escaped.replace(
        /Ruby|Rails|PostgreSQL|Redis|Sidekiq/g,
        (match) => `<span class="tw-kw">${match}</span>`,
      );
    default:
      return `<span class="tw-out">${escaped}</span>`;
  }
}

function formatTerminalText(text: string, activeCommandIndex: number): string {
  if (!text) return '';

  const lines = text.split('\n');
  const command = commands[activeCommandIndex];
  let html = '';
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line && i === lines.length - 1) {
      i += 1;
      continue;
    }

    if (i === 0 && line.startsWith('$ ')) {
      html += formatPrompt(line.slice(2));
      if (i < lines.length - 1) html += '\n';
      i += 1;
      continue;
    }

    if (line.startsWith('@F:')) {
      const flagRows: string[] = [];
      while (i < lines.length && lines[i].startsWith('@F:')) {
        flagRows.push(lines[i].slice(3));
        i += 1;
      }
      html += formatFlagBlock(flagRows);
      if (i < lines.length) html += '\n';
      continue;
    }

    if (line.length > 0) {
      html += formatOutput(line, command?.tone);
    }

    if (i < lines.length - 1) html += '\n';
    i += 1;
  }

  return html;
}

function expandFlagMarker(output: string): string {
  if (!output.includes(FLAG_MARKER)) return output;

  const flagBlock = FINLAND_FLAG_BASE.map((row) => `@F:${row}`).join('\n');
  return output.replace(FLAG_MARKER, `\n${flagBlock}`);
}

function buildBlock(command: Command): string {
  let block = `$ ${command.cmd}\n`;

  if (command.interactive) {
    if (command.interactive.prelude) {
      block += `${command.interactive.prelude}\n`;
    }
    if (command.output) {
      block += `${command.output}\n`;
    }
    block += `${command.interactive.prompt} ${command.interactive.answer}\n`;
    return block;
  }

  block += expandFlagMarker(command.output);
  return block;
}

function renderFullCommand(index: number): string {
  const command = commands[index];
  if (!command) return '';
  return buildBlock(command);
}

function resetOutputSegment(command: Command): void {
  outputStage = 'before';
  outputAfterIndex = 0;

  if (!command.interactive) {
    outputSegment = 'output';
    return;
  }

  if (command.interactive.prelude) {
    outputSegment = 'prelude';
    return;
  }

  outputSegment = 'prompt';
}

function getI18nData(): Record<string, { hero?: { commands?: Command[] } }> | undefined {
  return (window as Window & { __i18n?: Record<string, { hero?: { commands?: Command[] } }> }).__i18n;
}

function getContentEl(): HTMLElement | null {
  return document.getElementById('typewriter-content');
}

function updateCursorState(): void {
  showGameCursor = outputSegment === 'wait';
  showTypingCursor = animationActive && !clearing && !showGameCursor;
}

function paint(): void {
  const content = getContentEl();
  if (!content) return;

  updateCursorState();

  let html = formatTerminalText(currentText, commandIndex);

  if (showGameCursor) {
    html += '<span class="tw-game-cursor" aria-hidden="true">█</span>';
  } else if (showTypingCursor) {
    html += '<span class="tw-cursor" aria-hidden="true"></span>';
  }

  content.innerHTML = html;
}

export function syncTypewriterLocale(locale: Locale): void {
  const container = document.getElementById('typewriter');
  const next = getI18nData()?.[locale]?.hero?.commands;

  if (container && next) {
    container.dataset.commands = JSON.stringify(next);
    commands = next;
  }
}

function loadCommands(): boolean {
  const container = document.getElementById('typewriter');
  if (!container) return false;

  try {
    commands = JSON.parse(container.dataset.commands ?? '[]');
  } catch {
    return false;
  }

  return commands.length > 0;
}

function advanceInteractiveOutput(command: Command, now: number): boolean {
  const interactive = command.interactive;
  if (!interactive) return false;

  if (outputSegment === 'prelude' && interactive.prelude) {
    if (charIndex < interactive.prelude.length) {
      currentText += interactive.prelude[charIndex];
      charIndex += 1;
      return true;
    }

    currentText += '\n';
    charIndex = 0;
    outputSegment = command.output ? 'result' : 'prompt';
    return true;
  }

  if (outputSegment === 'result' && command.output) {
    if (charIndex < command.output.length) {
      currentText += command.output[charIndex];
      charIndex += 1;
      return true;
    }

    currentText += '\n';
    charIndex = 0;
    outputSegment = 'prompt';
    return true;
  }

  if (outputSegment === 'prompt') {
    if (charIndex < interactive.prompt.length) {
      currentText += interactive.prompt[charIndex];
      charIndex += 1;
      return true;
    }

    charIndex = 0;

    if (prefersReducedMotion()) {
      outputSegment = 'answer';
      return true;
    }

    outputSegment = 'wait';
    pauseUntil = now + (interactive.waitMs ?? 1400);
    updateCursorState();
    paint();
    requestAnimationFrame(tick);
    return false;
  }

  if (outputSegment === 'wait') {
    outputSegment = 'answer';
    return true;
  }

  if (outputSegment === 'answer') {
    if (charIndex < interactive.answer.length) {
      currentText += interactive.answer[charIndex];
      charIndex += 1;
      scheduleChar(now);
      paint();
      requestAnimationFrame(tick);
      return false;
    }

    currentText += '\n';
    charIndex = 0;
    outputSegment = 'none';
    outputStage = 'done';
    return true;
  }

  return false;
}

function advanceStandardOutput(command: Command, now: number): void {
  const parts = getOutputParts(command.output);

  if (outputStage === 'before') {
    if (charIndex < parts.before.length) {
      currentText += parts.before[charIndex];
      charIndex += 1;
      scheduleChar(now);
      return;
    }

    if (parts.hasFlag) {
      insertStaticFlag();
      outputStage = 'after';
      outputAfterIndex = 0;
      nextCharAt = 0;
      return;
    }

    outputStage = 'done';
    return;
  }

  if (outputStage === 'after') {
    if (outputAfterIndex < parts.after.length) {
      currentText += parts.after[outputAfterIndex];
      outputAfterIndex += 1;
      scheduleChar(now);
      return;
    }

    outputStage = 'done';
  }
}

function isOutputComplete(command: Command): boolean {
  if (outputStage !== 'done') return false;

  if (command.interactive) return true;

  const parts = getOutputParts(command.output);
  if (parts.hasFlag) {
    return outputAfterIndex >= parts.after.length;
  }

  return charIndex >= command.output.length;
}

function tick(now: number): void {
  if (!animationActive) return;

  const content = getContentEl();
  if (!content) return;

  if (now < pauseUntil || now < nextCharAt) {
    requestAnimationFrame(tick);
    return;
  }

  if (clearing) {
    currentText = '';
    showGameCursor = false;
    showTypingCursor = false;
    nextCharAt = 0;
    paint();
    clearing = false;
    charIndex = 0;
    isTypingOutput = false;
    outputSegment = 'none';
    outputStage = 'before';
    outputAfterIndex = 0;
    commandIndex = (commandIndex + 1) % commands.length;
    requestAnimationFrame(tick);
    return;
  }

  const command = commands[commandIndex];
  if (!command) {
    requestAnimationFrame(tick);
    return;
  }

  if (!isTypingOutput) {
    const prompt = `$ ${command.cmd}`;
    if (charIndex < prompt.length) {
      currentText += prompt[charIndex];
      charIndex += 1;
      scheduleChar(now);
    } else {
      currentText += '\n';
      charIndex = 0;
      isTypingOutput = true;
      resetOutputSegment(command);
      nextCharAt = 0;
    }
  } else if (command.interactive && outputSegment !== 'none') {
    if (advanceInteractiveOutput(command, now)) {
      scheduleChar(now);
      paint();
    }
    requestAnimationFrame(tick);
    return;
  } else if (!isOutputComplete(command)) {
    advanceStandardOutput(command, now);
  } else {
    pauseUntil = now + (commandIndex === commands.length - 1 ? PAUSE_LAST_COMMAND : PAUSE_BETWEEN_COMMANDS);
    clearing = true;
    requestAnimationFrame(tick);
    return;
  }

  paint();
  requestAnimationFrame(tick);
}

export function initTypewriter(): void {
  animationActive = false;

  const content = getContentEl();
  if (!content || !loadCommands()) return;

  commandIndex = 0;
  charIndex = 0;
  currentText = '';
  isTypingOutput = false;
  pauseUntil = 0;
  clearing = false;
  outputSegment = 'none';
  outputStage = 'before';
  outputAfterIndex = 0;
  showGameCursor = false;
  showTypingCursor = false;
  nextCharAt = 0;

  if (prefersReducedMotion()) {
    commandIndex = commands.length - 1;
    currentText = renderFullCommand(commandIndex);
    paint();
    return;
  }

  animationActive = true;
  requestAnimationFrame(tick);
}

/** Swap locale without replaying the typewriter from the start. */
export function refreshTypewriterLocale(locale: Locale): void {
  const content = getContentEl();
  if (!content) return;

  syncTypewriterLocale(locale);
  if (commands.length === 0) return;

  if (prefersReducedMotion()) {
    commandIndex = commands.length - 1;
    currentText = renderFullCommand(commandIndex);
    paint();
    return;
  }

  animationActive = true;
  currentText = renderFullCommand(commandIndex);
  charIndex = 0;
  isTypingOutput = true;
  clearing = false;
  outputSegment = 'output';
  outputStage = 'done';
  pauseUntil = performance.now() + 1800;
  nextCharAt = 0;
  paint();
  requestAnimationFrame(tick);
}

export function initTypewriterLocaleSync(): void {
  document.addEventListener('localechange', (event) => {
    const locale = (event as CustomEvent<{ locale: Locale }>).detail?.locale;
    if (!locale) return;
    refreshTypewriterLocale(locale);
  });
}
