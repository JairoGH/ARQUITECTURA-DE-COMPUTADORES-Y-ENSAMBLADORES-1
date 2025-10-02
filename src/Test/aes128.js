// AES-128 Encryption in JavaScript

// ===============================
// S-BOX AES
// ===============================
const SBOX = [
  0x63,0x7c,0x77,0x7b,0xf2,0x6b,0x6f,0xc5,0x30,0x01,0x67,0x2b,0xfe,0xd7,0xab,0x76,
  0xca,0x82,0xc9,0x7d,0xfa,0x59,0x47,0xf0,0xad,0xd4,0xa2,0xaf,0x9c,0xa4,0x72,0xc0,
  0xb7,0xfd,0x93,0x26,0x36,0x3f,0xf7,0xcc,0x34,0xa5,0xe5,0xf1,0x71,0xd8,0x31,0x15,
  0x04,0xc7,0x23,0xc3,0x18,0x96,0x05,0x9a,0x07,0x12,0x80,0xe2,0xeb,0x27,0xb2,0x75,
  0x09,0x83,0x2c,0x1a,0x1b,0x6e,0x5a,0xa0,0x52,0x3b,0xd6,0xb3,0x29,0xe3,0x2f,0x84,
  0x53,0xd1,0x00,0xed,0x20,0xfc,0xb1,0x5b,0x6a,0xcb,0xbe,0x39,0x4a,0x4c,0x58,0xcf,
  0xd0,0xef,0xaa,0xfb,0x43,0x4d,0x33,0x85,0x45,0xf9,0x02,0x7f,0x50,0x3c,0x9f,0xa8,
  0x51,0xa3,0x40,0x8f,0x92,0x9d,0x38,0xf5,0xbc,0xb6,0xda,0x21,0x10,0xff,0xf3,0xd2,
  0xcd,0x0c,0x13,0xec,0x5f,0x97,0x44,0x17,0xc4,0xa7,0x7e,0x3d,0x64,0x5d,0x19,0x73,
  0x60,0x81,0x4f,0xdc,0x22,0x2a,0x90,0x88,0x46,0xee,0xb8,0x14,0xde,0x5e,0x0b,0xdb,
  0xe0,0x32,0x3a,0x0a,0x49,0x06,0x24,0x5c,0xc2,0xd3,0xac,0x62,0x91,0x95,0xe4,0x79,
  0xe7,0xc8,0x37,0x6d,0x8d,0xd5,0x4e,0xa9,0x6c,0x56,0xf4,0xea,0x65,0x7a,0xae,0x08,
  0xba,0x78,0x25,0x2e,0x1c,0xa6,0xb4,0xc6,0xe8,0xdd,0x74,0x1f,0x4b,0xbd,0x8b,0x8a,
  0x70,0x3e,0xb5,0x66,0x48,0x03,0xf6,0x0e,0x61,0x35,0x57,0xb9,0x86,0xc1,0x1d,0x9e,
  0xe1,0xf8,0x98,0x11,0x69,0xd9,0x8e,0x94,0x9b,0x1e,0x87,0xe9,0xce,0x55,0x28,0xdf,
  0x8c,0xa1,0x89,0x0d,0xbf,0xe6,0x42,0x68,0x41,0x99,0x2d,0x0f,0xb0,0x54,0xbb,0x16
];

// ===============================
// RCON y matriz de MixColumns
// ===============================
const RCON = [0x01,0x02,0x04,0x08,0x10,0x20,0x40,0x80,0x1B,0x36];
const MIX = [
  [0x02,0x03,0x01,0x01],
  [0x01,0x02,0x03,0x01],
  [0x01,0x01,0x02,0x03],
  [0x03,0x01,0x01,0x02]
];

// ===============================
// Utilidades
// ===============================
const toHex2 = (n) => n.toString(16).toUpperCase().padStart(2, '0');
const fromHex = (hh) => parseInt(hh,16) & 0xFF;

function printMatrix(title, m) {
  console.log(`\n${title}:`);
  for (const row of m) console.log(row.join(' '));
}

// Coloca bytes en matriz 4x4 en column-major: state[r][c] = bytes[r + 4*c]
function bytesToStateColMajor(bytes16) {
  const st = Array.from({length:4}, ()=>Array(4).fill('00'));
  for (let r=0; r<4; r++) {
    for (let c=0; c<4; c++) {
      st[r][c] = toHex2(bytes16[r + 4*c]);
    }
  }
  return st;
}

// Extrae en el mismo orden columna-por-columna
function stateToBytesColMajor(state) {
  const out = [];
  for (let c=0; c<4; c++) {
    for (let r=0; r<4; r++) out.push(fromHex(state[r][c]));
  }
  return out;
}

// ===============================
// GF(2^8) multiply (AES)
// ===============================
function gmul(a,b){
  let p = 0;
  for (let i=0;i<8;i++){
    if (b & 1) p ^= a;
    const hi = a & 0x80;
    a = (a << 1) & 0xFF;
    if (hi) a ^= 0x1B;
    b = b >>> 1;
  }
  return p & 0xFF;
}

// ===============================
// Transformaciones del estado
// ===============================
function subBytes(state){
  const s = state.map(row => row.map(hh => toHex2(SBOX[fromHex(hh)])));
  return s;
}

function shiftRows(state){
  return [
    state[0].slice(),
    state[1].slice(1).concat(state[1].slice(0,1)),
    state[2].slice(2).concat(state[2].slice(0,2)),
    state[3].slice(3).concat(state[3].slice(0,3)),
  ];
}

// MixColumns usando multiplicación en GF(2^8)
function mixColumns(state){
  const res = Array.from({length:4}, ()=>Array(4).fill('00'));
  for (let c=0; c<4; c++){
    const col = [fromHex(state[0][c]), fromHex(state[1][c]), fromHex(state[2][c]), fromHex(state[3][c])];
    for (let r=0; r<4; r++){
      let v = 0;
      for (let i=0; i<4; i++) v ^= gmul(MIX[r][i], col[i]);
      res[r][c] = toHex2(v);
    }
  }
  return res;
}

// AddRoundKey (XOR entre dos matrices 4x4)
function xorMatrices(a,b){
  const out = Array.from({length:4}, ()=>Array(4).fill('00'));
  for (let r=0;r<4;r++){
    for (let c=0;c<4;c++){
      out[r][c] = toHex2(fromHex(a[r][c]) ^ fromHex(b[r][c]));
    }
  }
  return out;
}

// ===============================
// Key Expansion AES-128 -> 11 subclaves (matrices 4x4)
// ===============================
function keyExpansion(hexKeyBytes){
  const Nk = 4, Nr = 10;
  // Palabras iniciales (4 palabras de 4 bytes)
  const w = [];// cada palabra es [b0,b1,b2,b3] bytes (number)
  for (let i=0;i<Nk;i++){
    w.push([
      fromHex(hexKeyBytes[4*i+0]),
      fromHex(hexKeyBytes[4*i+1]),
      fromHex(hexKeyBytes[4*i+2]),
      fromHex(hexKeyBytes[4*i+3])
    ]);
  }
  // Expandir hasta 44 palabras
  for (let i=Nk;i<4*(Nr+1);i++){
    let temp = w[i-1].slice();
    if (i % Nk === 0){
      // RotWord
      temp = [temp[1],temp[2],temp[3],temp[0]];
      // SubWord
      temp = temp.map(b=>SBOX[b] & 0xFF);
      // RCON
      temp[0] ^= RCON[(i/Nk)-1];
    }
    const prev = w[i-Nk];
    w.push([
      (prev[0] ^ temp[0]) & 0xFF,
      (prev[1] ^ temp[1]) & 0xFF,
      (prev[2] ^ temp[2]) & 0xFF,
      (prev[3] ^ temp[3]) & 0xFF,
    ]);
  }
  // Organizar en 11 matrices 4x4 en column-major
  const roundKeys = [];
  for (let r=0; r<=Nr; r++){
    const rk = Array.from({length:4}, ()=>Array(4).fill('00'));
    for (let c=0;c<4;c++){
      for (let rr=0; rr<4; rr++) rk[rr][c] = toHex2(w[4*r+c][rr]);
    }
    roundKeys.push(rk);
  }
  return roundKeys;
}

// ===============================
// Entrada/salida y flujo principal
// ===============================
function normalizeKeyHex(input){
  let h = (input||'').trim().replace(/\s+/g,'').toUpperCase();
  if (h.length % 2 === 1) h += '0';           // impar -> completa con '0'
  if (h.length < 32) h = h.padEnd(32,'0');    // < 32 -> rellena con '0'
  if (h.length > 32) h = h.slice(0,32);       // > 32 -> trunca
  return h;
}

function textToFixed16Bytes(text){
  const bytes = Array.from(text||'').slice(0,16).map(ch => ch.charCodeAt(0) & 0xFF);
  while (bytes.length < 16) bytes.push(0x00);
  return bytes;
}

function aesEncryptVerbose(plaintext, keyHex){
  // 1) preparar estado inicial (col-major)
  const ptBytes = textToFixed16Bytes(plaintext);
  const state0 = bytesToStateColMajor(ptBytes);

  // 2) preparar subclaves
  const kHex = normalizeKeyHex(keyHex);
  const keyBytes = [];
  for (let i=0;i<32;i+=2) keyBytes.push(kHex.slice(i,i+2));
  const roundKeys = keyExpansion(keyBytes);

  console.log("=== INICIO DEL CIFRADO ===");
  console.log(`Texto original: '${plaintext}'`);
  console.log(`Clave (HEX): ${kHex}`);
  printMatrix("Estado inicial", state0);
  printMatrix("Clave original", roundKeys[0]);

  // 3) AddRoundKey inicial
  let state = xorMatrices(state0, roundKeys[0]);
  printMatrix("Paso 0: AddRoundKey inicial", state);

  // 4) Rondas 1..9
  for (let rnd=1; rnd<=9; rnd++){
    console.log(`\n===== RONDA ${rnd} =====`);
    state = subBytes(state);     printMatrix("Paso 1: SubBytes", state);
    state = shiftRows(state);    printMatrix("Paso 2: ShiftRows", state);
    state = mixColumns(state);   printMatrix("Paso 3: MixColumns", state);
    printMatrix(`Subclave Ronda ${rnd} actual`, roundKeys[rnd]);
    state = xorMatrices(state, roundKeys[rnd]);
    printMatrix(`Paso 4: AddRoundKey (Subclave ${rnd})`, state);
  }

  // 5) Ronda 10 (sin MixColumns)
  console.log("\n===== RONDA 10 =====");
  state = subBytes(state);     printMatrix("Paso 1: SubBytes", state);
  state = shiftRows(state);    printMatrix("Paso 2: ShiftRows", state);
  state = xorMatrices(state, roundKeys[10]);
  printMatrix("Paso 3: AddRoundKey", state);

  console.log("\n === RESULTADO FINAL DEL CIFRADO ===");
  printMatrix("Estado final", state);
  console.log("===========================================");

  // 6) Convertir HEX->string en orden col-major (c,r)
  const outBytes = stateToBytesColMajor(state);
  const outText = String.fromCharCode(...outBytes);
  console.log("\n Texto Resultante:");
  console.log(outText);

  return {state, outText};
}

// ===============================
// CLI
// ===============================
function parseArgs(argv){
  const args = { text: null, key: null };
  for (let i=2;i<argv.length;i++){
    const a = argv[i];
    if (a === '--text') { args.text = argv[++i] ?? ''; }
    else if (a === '--key') { args.key = argv[++i] ?? ''; }
  }
  return args;
}

async function main(){
  const { text, key } = parseArgs(process.argv);
  if (text != null && key != null){
    aesEncryptVerbose(text, key);
    return;
  }
  // modo interactivo simple
  const readline = await import('node:readline');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const q = (p) => new Promise(res=>rl.question(p, res));
  const t = await q('Ingrese el texto a cifrar (Máximo 16 caracteres): ');
  const k = await q('Ingrese la clave (Máximo 32 Hexadecimales): ');
  rl.close();
  aesEncryptVerbose(t, k);
}

if (require.main === module){
  main();
}
