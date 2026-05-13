// ======================= KeyExpansion ========================

    // Seccion .bss: Almacena las 11 subclaves de ronda (16 * 11 = 176 bytes)
    .section .bss
    .align 4
    .global roundKeys
roundKeys:
    .space 16 * 11, 0      // 176 bytes: subclaves 0 a 10 (44 palabras * 4 bytes/palabra)

    .section .text
    .align 2
    .global keyExpansion
    .type   keyExpansion, %function

    .extern key             // Clave inicial de 16 bytes (input)
    .extern Sbox            // Tabla de sustitución (ByteSub)
    .extern Rcon            // Constantes de ronda

keyExpansion:
    // Prólogo: Guardar el frame pointer (x29), link register (x30) y callee-saved registers (x19-x24)
    stp x29, x30, [sp, #-64]!
    mov x29, sp
    stp x19, x20, [sp, #16]
    stp x21, x22, [sp, #32]
    stp x23, x24, [sp, #48]

    // Punteros base para las tablas y la clave inicial
    ldr x5, =roundKeys      // Base de almacenamiento de todas las subclaves
    ldr x1, =key            // Base de la clave inicial de 16 bytes
    ldr x6, =Sbox           // Base de la S-box
    ldr x7, =Rcon           // Base de las Rcon

    // -------- Posicionamiento correcto de la primera subclave útil (Subclave 0) --------
    // Copia directa de la clave inicial (key) a la subclave de ronda 0 (roundKeys[0])
    mov x2, #16             // x2 = contador de bytes
1:  cbz x2, 2f              // Si x2=0, termina la copia
    ldrb w0, [x1], #1       // Cargar byte de key e incrementar x1
    strb w0, [x5], #1       // Almacenar byte en roundKeys e incrementar x5
    sub  x2, x2, #1
    b    1b
2:
    // Reiniciar el puntero a la base de roundKeys
    ldr x5, =roundKeys

    // i = 4 .. 43 (Palabras de 4 bytes)
    mov x3, #4              // x3 es el índice de palabra 'i', comienza en W[4]

// =============== Bucle de calculo de cada palabra según su índice =================
keyexp_loop:
    cmp x3, #44             // Bucle hasta W[43]
    b.ge keyexp_done

    // Direcciones de palabras: W[i], W[i-1], W[i-4]
    // x8 = &W[i][0] (Dirección de la palabra a calcular)
    mov x8, x3
    lsl x8, x8, #2            // x8 = i * 4 (offset en bytes)
    add x8, x5, x8            // x8 = &roundKeys[i*4]

    // x9 = &W[i-1][0]
    sub x9, x3, #1
    lsl x9, x9, #2
    add x9, x5, x9            // x9 = &roundKeys[(i-1)*4]

    // x10 = &W[i-4][0]
    sub x10, x3, #4
    lsl x10, x10, #2
    add x10, x5, x10          // x10 = &roundKeys[(i-4)*4]

    // 1. Cargar temp = W[i-1] (W20-W23)
    ldrb w20, [x9]            // temp[0]
    ldrb w21, [x9, #1]        // temp[1]
    ldrb w22, [x9, #2]        // temp[2]
    ldrb w23, [x9, #3]        // temp[3]

    // 2. Aplicar g(temp) si (i % 4 == 0)
    // g(temp) = Rcon[i/4] XOR SubWord(RotWord(temp))
    and x4, x3, #3            // x4 = i mod 4
    cbnz x4, 5f               // Si no es múltiplo de 4, salta a 5f

    // a) RotWord: (b0,b1,b2,b3) -> (b1,b2,b3,b0)
    // Se realiza con movimientos de registros
    mov w19, w20              // w19 = b0
    mov w20, w21              // b0 = b1
    mov w21, w22              // b1 = b2
    mov w22, w23              // b2 = b3
    mov w23, w19              // b3 = b0 original

    // b) Utilización de la función ByteSub (SubWord en los 4 bytes)
    // Sustituir cada byte rotado con Sbox[byte]
    uxtw x0, w20              // índice = b1 (byte rotado)
    add  x0, x6, x0           // dirección = Sbox + índice
    ldrb w20, [x0]            // w20 = Sbox[w20]

    uxtw x0, w21
    add  x0, x6, x0
    ldrb w21, [x0]

    uxtw x0, w22
    add  x0, x6, x0
    ldrb w22, [x0]

    uxtw x0, w23
    add  x0, x6, x0
    ldrb w23, [x0]

    // c) Utilización de la matriz constante Rcon
    lsr x0, x3, #2            // x0 = i/4 (índice de Rcon en [1..10])
    sub x0, x0, #1            // x0 = índice de Rcon en [0..9]
    lsl x0, x0, #2            // offset en bytes (Rcon usa 4 bytes por constante)
    add x0, x7, x0            // dirección = Rcon + offset
    ldrb w1, [x0]             // w1 = Rcon[i/4 - 1] (solo se usa el primer byte)
    eor  w20, w20, w1         // temp[0] XOR Rcon[i/4 - 1]

5:
    // 3. W[i] = W[i-4] XOR temp (byte a byte)
    // Cargar W[i-4] (w24-w27)
    ldrb w24, [x10]           // wprev[0]
    ldrb w25, [x10, #1]
    ldrb w26, [x10, #2]
    ldrb w27, [x10, #3]

    // XOR byte a byte y almacenar W[i]
    eor  w24, w24, w20
    eor  w25, w25, w21
    eor  w26, w26, w22
    eor  w27, w27, w23

    strb w24, [x8]
    strb w25, [x8, #1]
    strb w26, [x8, #2]
    strb w27, [x8, #3]

    // Siguiente palabra
    add x3, x3, #1
    b   keyexp_loop

// ================= Final de expansion =================
keyexp_done:
    // Epílogo: restaurar callee-saved y retornar
    ldp x23, x24, [sp, #48]
    ldp x21, x22, [sp, #32]
    ldp x19, x20, [sp, #16]
    ldp x29, x30, [sp], #64
    ret

    .size keyExpansion, (. - keyExpansion)