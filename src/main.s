/*  == main.s === 
    == @author Jairo Gomez 201902672 */

    .section .data
    .global newline
newline:                .asciz "\n"

msg_txt:                .asciz "Ingrese el texto a cifrar (Maximo 16 caracteres): "
lenMsgTxt = . - msg_txt

msg_key:                .asciz "Ingrese la clave (Maximo 32 Hexadecimales): "
lenMsgKey = . - msg_key

key_err_msg:            .asciz "Error: Valor de clave incorrecto\n"
lenKeyErr = . - key_err_msg

debug_state:            .asciz "Matriz de Estado:\n"
lenDebugState = . - debug_state

debug_key:              .asciz "Matriz de Clave:\n"
lenDebugKey = . - debug_key

// ---- NUEVOS MENSAJES PARA EL FLUJO DE RONDAS ----
hdr_round1:             .asciz " ========= Ronda 1 ========= \n"
lenHdrRound1   = . - hdr_round1

hdr_add:                .asciz " -------- AddRoundKey -------- \n"
lenHdrAdd      = . - hdr_add

hdr_sub:                .asciz " -------- SubBytes -------- \n"
lenHdrSub      = . - hdr_sub

hdr_shift:              .asciz " -------- ShiftRows -------- \n"
lenHdrShift   = . - hdr_shift

hdr_mix:                .asciz " -------- MixColumns -------- \n"
lenHdrMix      = . - hdr_mix

// Errores
err_txt_empty:          .asciz "Error: el texto no puede estar vacio.\n"
lenErrTxtEmpty = . - err_txt_empty

err_txt_len:            .asciz "Error: el texto excede 16 caracteres.\n"
lenErrTxtLen  = . - err_txt_len

err_key_len:            .asciz "Error: la clave no debe exceder 32 hex.\n"
lenErrKeyLen  = . - err_key_len

err_key_short:          .asciz "Error: la clave debe tener al menos 1 hex.\n"
lenErrKeyShort = . - err_key_short

err_key_char:           .asciz "Error: la clave solo admite [0-9A-Fa-f].\n"
lenErrKeyChar = . - err_key_char

    // -----------------------------------------------------------------
    // .bss: buffers y estado AES
    // -----------------------------------------------------------------
    .section .bss
    .align 4
    .global matState
matState:               .space 16, 0     // Estado AES (column-major)

    .global key
key:                    .space 16, 0     // Clave 128-bit (column-major)

    .global criptograma
criptograma:            .space 16, 0

buffer:                 .space 256, 0
temp_buffer:            .space 64, 0

    .section .text

// ====== Syscall Ayuda ======
.macro print fd, buffer, len
    mov x0, \fd
    ldr x1, =\buffer
    mov x2, \len
    mov x8, #64                // Escritura
    svc #0
.endm

.macro read fd, buffer, len
    mov x0, \fd
    ldr x1, =\buffer
    mov x2, \len
    mov x8, #63                // Lectura
    svc #0
.endm

// --------------------- Prototipos externos ---------------------
    .extern addRoundKey        // Fun/AddRoundKey.s  
    .extern subBytes           // Fun/ByteSub.s 
    .extern shiftRows          // Fun/ShiftRow.s
    .extern mixColumns         // Fun/MixColumns.s
    .extern Sbox               // Libs/Constants.s
    .extern Rcon

// Exports locales
    .global print_hex_byte
    .global printMatrix

// ============= readTextInput =============
    .type   readTextInput, %function
    .global readTextInput
readTextInput:
    stp x29, x30, [sp, #-16]!
    mov x29, sp

    read 0, buffer, 256

    // calcular longitud hasta '\n' o NUL
    ldr x1, =buffer
    mov x2, #0
    mov x3, #0
1:  ldrb w4, [x1, x2]
    cbz  w4, 2f
    cmp  w4, #10
    b.eq 2f
    add  x2, x2, #1
    add  x3, x3, #1
    b    1b
2:
    cbz x3, 8f                     // vacío
    cmp x3, #16
    b.gt 9f                        // largo > 16

    // limpiar matState
    ldr x5, =matState
    mov x6, #0
    mov x7, #16
3:  cbz x7, 4f
    strb w6, [x5], #1
    sub  x7, x7, #1
    b    3b
4:
    // copiar a column-major: off = fila + col*4 
    ldr x1, =buffer
    ldr x2, =matState
    mov x8, #0
5:  cmp x8, x3
    b.ge 7f
    mov  x9, #4
    udiv x10, x8, x9               // col = i/4
    msub x11, x10, x9, x8          // fila = i%4
    mul  x12, x10, x9              // col*4
    add  x12, x11, x12             // off = fila + col*4  
    ldrb w13, [x1, x8]
    strb w13, [x2, x12]
    add  x8, x8, #1
    b    5b
7:  mov w0, #0
    ldp x29, x30, [sp], #16
    ret

8:  // Error: Si esta vacio
    print 1, err_txt_empty, lenErrTxtEmpty
    mov w0, #1
    ldp x29, x30, [sp], #16
    ret

9:  // Error: Demasiado largo
    print 1, err_txt_len, lenErrTxtLen
    mov w0, #1
    ldp x29, x30, [sp], #16
    ret
    .size readTextInput, (. - readTextInput)

// =========  HEX HELPER =========
    .type is_hex_char, %function
is_hex_char:
    // w4 = char
    cmp w4, #'0' ; b.lt 1f
    cmp w4, #'9' ; b.le 2f
    orr w4, w4, #0x20
    cmp w4, #'a' ; b.lt 1f
    cmp w4, #'f' ; b.le 2f
1:  mov w0, #0 ; ret
2:  mov w0, #1 ; ret
    .size is_hex_char, (. - is_hex_char)

    .type hex_char_to_nibble, %function
hex_char_to_nibble:
    // w4 = char (válido)
    cmp w4, #'0' ; b.lt 3f
    cmp w4, #'9' ; b.le 4f
    orr w4, w4, #0x20
    cmp w4, #'a' ; b.lt 3f
    cmp w4, #'f' ; b.gt 3f
    sub w0, w4, #'a'
    add w0, w0, #10
    ret
4:  sub w0, w4, #'0'
    ret
3:  // inesperado
    print 1, key_err_msg, lenKeyErr
    mov w0, #0
    ret
    .size hex_char_to_nibble, (. - hex_char_to_nibble)

// ===== convertHexKey: lee hasta 32 hex, permite impar y guarda 16 bytes en 'key' =====
    .type   convertHexKey, %function
    .global convertHexKey
convertHexKey:
    stp x29, x30, [sp, #-16]!
    mov x29, sp

    read 0, buffer, 64

    // contar nibbles válidos
    ldr x1, =buffer
    mov x2, #0
    mov x3, #0          // nibbles
1:  ldrb w4, [x1, x2]
    cbz  w4, 2f
    cmp  w4, #10
    b.eq 2f
    bl   is_hex_char
    cmp  w0, #1
    b.ne 9f
    add  x3, x3, #1
    add  x2, x2, #1
    b    1b
2:
    cbz  x3, 8f
    cmp  x3, #32
    b.gt 7f

    // limpiar key
    ldr x2, =key
    mov x5, #16
    mov w6, #0
3:  cbz x5, 4f
    strb w6, [x2], #1
    sub  x5, x5, #1
    b    3b
4:
    // padding si impar
    and x4, x3, #1
    mov x19, x3
    cbz x4, 5f
    add x19, x3, #1
5:  lsr x13, x19, #1     // bytes a generar

    // convertir nibbles -> bytes
    ldr x1, =buffer
    ldr x2, =key
    mov x10, #0          // byte idx
    mov x7,  #0          // nibble idx (0..x3-1)
6:  cmp x10, x13
    b.ge 10f
    // HIGH
    cmp x7, x3
    b.lo 11f
    mov w4, #'0'
    b   12f
11: ldrb w4, [x1], #1
12: bl hex_char_to_nibble
    lsl w5, w0, #4
    add x7, x7, #1
    // LOW
    cmp x7, x3
    b.lo 13f
    mov w4, #'0'
    b   14f
13: ldrb w4, [x1], #1
14: bl hex_char_to_nibble
    orr w5, w5, w0
    add x7, x7, #1

    // off = fila + col*4  
    mov  x9, #4
    udiv x11, x10, x9              // col
    msub x12, x11, x9, x10         // fila
    mul  x17, x11, x9              // col*4
    add  x17, x12, x17             // fila + col*4
    strb w5, [x2, x17]

    add  x10, x10, #1
    b    6b

7:  // clave > 32 hex
    print 1, err_key_len, lenErrKeyLen
    mov w0, #1
    ldp x29, x30, [sp], #16
    ret
8:  // clave vacía
    print 1, err_key_short, lenErrKeyShort
    mov w0, #1
    ldp x29, x30, [sp], #16
    ret
9:  // char inválido
    print 1, err_key_char, lenErrKeyChar
    mov w0, #1
    ldp x29, x30, [sp], #16
    ret

10: mov w0, #0
    ldp x29, x30, [sp], #16
    ret
    .size convertHexKey, (. - convertHexKey)

// ======== print_hex_byte ========
    .type   print_hex_byte, %function
    .global print_hex_byte
print_hex_byte:
    stp x29, x30, [sp, #-16]!
    mov x29, sp
    and w1, w0, #0xF0
    lsr w1, w1, #4
    and w2, w0, #0x0F
    cmp w1, #10 ; b.lt 1f
    add w1, w1, #'A' - 10 ; b 2f
1:  add w1, w1, #'0'
2:  cmp w2, #10 ; b.lt 3f
    add w2, w2, #'A' - 10 ; b 4f
3:  add w2, w2, #'0'
4:  sub sp, sp, #16
    strb w1, [sp]
    strb w2, [sp, #1]
    mov  w3, #' '
    strb w3, [sp, #2]
    mov x0, #1
    mov x1, sp
    mov x2, #3
    mov x8, #64
    svc #0
    add sp, sp, #16
    ldp x29, x30, [sp], #16
    ret
    .size print_hex_byte, (. - print_hex_byte)

// ======= printMatrix(ptr, msg, len): imprime 4x4 (por filas) =======
    .type   printMatrix, %function
    .global printMatrix
printMatrix:
    stp x29, x30, [sp, #-32]!
    mov x29, sp
    stp x20, x21, [sp, #16]

    mov x20, x0      // ptr matriz
    mov x21, x1      // ptr mensaje

    // write etiqueta
    mov x0, #1
    mov x1, x21
    // x2 ya viene como len
    mov x8, #64
    svc #0

    // 4x4 ( off = fila + col*4)
    mov x23, #0                       // fila
1:  cmp x23, #4
    b.ge 3f
    mov x24, #0                       // col
2:  cmp x24, #4
    b.ge 4f
    mov x25, #4
    mul x25, x24, x25                 // col*4
    add x25, x25, x23                 // off = fila + col*4 
    ldrb w0, [x20, x25]
    bl  print_hex_byte
    add x24, x24, #1
    b   2b
4:  // newline por fila
    mov x0, #1
    ldr x1, =newline
    mov x2, #1
    mov x8, #64
    svc #0
    add x23, x23, #1
    b   1b
3:
    mov x0, #1
    ldr x1, =newline
    mov x2, #1
    mov x8, #64
    svc #0

    ldp x20, x21, [sp, #16]
    ldp x29, x30, [sp], #32
    ret
    .size printMatrix, (. - printMatrix)

// ================================================================
// encript (placeholder): copia matState -> criptograma
// ================================================================
    .type   encript, %function
    .global encript
encript:
    stp x29, x30, [sp, #-16]!
    mov x29, sp
    ldr x0, =matState
    ldr x1, =criptograma
    mov x2, #16
1:  cbz x2, 2f
    ldrb w3, [x0], #1
    strb w3, [x1], #1
    sub  x2, x2, #1
    b    1b
2:  ldp x29, x30, [sp], #16
    ret
    .size encript, (. - encript)

// ================================================================
// _start (Entry Point)
// ================================================================
    .type   _start, %function
    .global _start
_start:
txt_retry:
    print 1, msg_txt, lenMsgTxt
    bl   readTextInput
    cmp  w0, #0
    b.ne txt_retry

    // Estado inicial
    ldr x0, =matState
    ldr x1, =debug_state
    mov x2, lenDebugState
    bl  printMatrix

key_retry:
    print 1, msg_key, lenMsgKey
    bl   convertHexKey
    cmp  w0, #0
    b.ne key_retry

    // Clave Round 0
    ldr x0, =key
    ldr x1, =debug_key
    mov x2, lenDebugKey
    bl  printMatrix

    // ======= RONDA 1 =======
    print 1, hdr_round1, lenHdrRound1

    // ---- AddRoundKey (Ronda 1) ----
    print 1, hdr_add, lenHdrAdd
    ldr x0, =matState          // state*
    ldr x1, =key               // roundKey*
    mov x2, #0                 // debugFlag 
    bl  addRoundKey

    // Estado tras AddRoundKey
    ldr x0, =matState
    ldr x1, =debug_state
    mov x2, lenDebugState
    bl  printMatrix

    // ---- SubBytes (Ronda 1) ----
    print 1, hdr_sub, lenHdrSub
    bl  subBytes

    // Estado tras SubBytes
    ldr x0, =matState
    ldr x1, =debug_state
    mov x2, lenDebugState
    bl  printMatrix

    // ---- ShiftRows (Ronda 1) ----
    print 1, hdr_shift, lenHdrShift
    bl  shiftRows

    // Estado tras ShiftRows
    ldr x0, =matState
    ldr x1, =debug_state
    mov x2, lenDebugState
    bl  printMatrix

    // ---- MixColumns (Ronda 1) ----
    print 1, hdr_mix, lenHdrMix
    bl  mixColumns

    // Estado tras MixColumns
    ldr x0, =matState
    ldr x1, =debug_state
    mov x2, lenDebugState
    bl  printMatrix

    // Placeholder de cifrado (copia)
    bl  encript

    // exit(0)
    mov x0, #0
    mov x8, #93
    svc #0

    .size _start, (. - _start)
