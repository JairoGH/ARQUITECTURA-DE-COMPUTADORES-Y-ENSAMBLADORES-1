// ======================= KeyExpansion ========================
    .section .bss
    .align 4
    .global roundKeys
roundKeys:
    .space 16 * 11, 0      // 176 bytes: subclaves 0 a 10

    .section .text
    .align 2
    .global keyExpansion
    .type   keyExpansion, %function

    .extern key
    .extern Sbox
    .extern Rcon

keyExpansion:
    stp x29, x30, [sp, #-64]!
    mov x29, sp
    stp x19, x20, [sp, #16]
    stp x21, x22, [sp, #32]
    stp x23, x24, [sp, #48]

    // Punteros base
    ldr x5, =roundKeys
    ldr x1, =key
    ldr x6, =Sbox
    ldr x7, =Rcon

    // -------- Subclave 0: copia directa de key (16 bytes) --------
    mov x2, #16
1:  cbz x2, 2f
    ldrb w0, [x1], #1
    strb w0, [x5], #1
    sub  x2, x2, #1
    b    1b
2:
    // x5 queda al final de subclave 0; para calculos, mejor conservar base:
    ldr x5, =roundKeys

    // i = 4 .. 43  (palabras de 4 bytes)
    mov x3, #4

// =============== Bucle de expansion de claves =================
keyexp_loop:
    cmp x3, #44
    b.ge keyexp_done

    // Direcciones de palabras: W[i], W[i-1], W[i-4]
    // Cada palabra ocupa 4 bytes contiguos
    mov x8, x3
    lsl x8, x8, #2            // x8 = i*4
    add x8, x5, x8            // x8 = &W[i][0]

    sub x9, x3, #1
    lsl x9, x9, #2
    add x9, x5, x9            // x9 = &W[i-1][0]

    sub x10, x3, #4
    lsl x10, x10, #2
    add x10, x5, x10          // x10 = &W[i-4][0]

    // temp = W[i-1]
    ldrb w20, [x9]            // temp[0]
    ldrb w21, [x9, #1]        // temp[1]
    ldrb w22, [x9, #2]        // temp[2]
    ldrb w23, [x9, #3]        // temp[3]

    // if (i % 4 == 0) temp = g(temp)
    // RotWord: (b0,b1,b2,b3) -> (b1,b2,b3,b0)
    and x4, x3, #3
    cbnz x4, 5f

    // RotWord
    mov w19, w20              // save b0
    mov w20, w21              // b1
    mov w21, w22              // b2
    mov w22, w23              // b3
    mov w23, w19              // b0

    // SubWord (Sbox)
    // w20 = Sbox[w20], etc.
    // addr = Sbox + byte
    uxtw x0, w20
    add  x0, x6, x0
    ldrb w20, [x0]

    uxtw x0, w21
    add  x0, x6, x0
    ldrb w21, [x0]

    uxtw x0, w22
    add  x0, x6, x0
    ldrb w22, [x0]

    uxtw x0, w23
    add  x0, x6, x0
    ldrb w23, [x0]

    // Rcon: índice = (i/4) - 1, y sólo se XOR al primer byte
    lsr x0, x3, #2            // x0 = i/4
    sub x0, x0, #1            // x0 = (i/4) - 1  en [0 a 9]
    lsl x0, x0, #2            // Rcon está con 4 bytes por fila
    add x0, x7, x0
    ldrb w1, [x0]             // Rcon[ idx ][0]
    eor  w20, w20, w1         // temp[0] XOR Rcon
5:
    // W[i] = W[i-4] XOR temp (byte a byte)
    ldrb w24, [x10]           // wprev[0]
    ldrb w25, [x10, #1]
    ldrb w26, [x10, #2]
    ldrb w27, [x10, #3]

    eor  w24, w24, w20
    eor  w25, w25, w21
    eor  w26, w26, w22
    eor  w27, w27, w23

    strb w24, [x8]
    strb w25, [x8, #1]
    strb w26, [x8, #2]
    strb w27, [x8, #3]

    add x3, x3, #1
    b   keyexp_loop

// ================= Final de expansion =================
keyexp_done:
    ldp x23, x24, [sp, #48]
    ldp x21, x22, [sp, #32]
    ldp x19, x20, [sp, #16]
    ldp x29, x30, [sp], #64
    ret

    .size keyExpansion, (. - keyExpansion)
