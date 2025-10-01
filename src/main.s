/*  == main.s === 
    == @author Jairo Gomez ==
    == 201902672 ==
*/

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

// ---- ENCABEZADOS FLUJO AES ----
hdr_step0:              .asciz "Paso 0: AddRoundKey inicial:\n"
lenHdrStep0    = . - hdr_step0

// Encabezado genérico de ronda
hdr_round:              .asciz " ========== RONDA "
lenHdrRound    = . - hdr_round
hdr_round_tail:         .asciz " ========== \n"
lenHdrRoundTail = . - hdr_round_tail

hdr_step1:              .asciz " ========== Paso 1: SubBytes ========== \n"
lenHdrStep1    = . - hdr_step1

hdr_step2:              .asciz " ========== Paso 2: ShiftRows ========== \n"
lenHdrStep2    = . - hdr_step2

hdr_step3:              .asciz " ========== Paso 3: MixColumns ========== \n"
lenHdrStep3    = . - hdr_step3

hdr_step4:              .asciz " ========== Paso 4: AddRoundKey ========== \n"
lenHdrStep4    = . - hdr_step4

hdr_subkey:             .asciz " ========== Subclave de la ronda: ========== \n"
lenHdrSubkey   = . - hdr_subkey

// --- SALIDAS FINALES ---
result_banner_top:      .asciz " ========== RESULTADO FINAL DEL CIFRADO  ========== \n"
lenBannerTop    = . - result_banner_top

ascii_banner:           .asciz " ========== TEXTO RESULTANTE ========== \n"
lenAsciiBanner  = . - ascii_banner

// ---- ERRORES ----
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
// .bss: buffers y estado
// -----------------------------------------------------------------
    .section .bss
    .align 4
    .global matState
matState:               .space 16, 0     // Estado AES (column-major)

    .global key
key:                    .space 16, 0     // Clave activa 128-bit (column-major)

buffer:                 .space 256, 0
temp_buffer:            .space 64, 0

// -----------------------------------------------------------------
    .section .text
// Syscall helpers
.macro print fd, buffer, len
    mov x0, \fd
    ldr x1, =\buffer
    mov x2, \len
    mov x8, #64
    svc #0
.endm

.macro read fd, buffer, len
    mov x0, \fd
    ldr x1, =\buffer
    mov x2, \len
    mov x8, #63
    svc #0
.endm

// ========== Funciones externas ==========
    .extern addRoundKey
    .extern subBytes
    .extern shiftRows
    .extern mixColumns
    .extern keyExpansion
    .extern roundKeys

// ========== Exports locales ==========
    .global print_hex_byte
    .global printMatrix
    .global readTextInput
    .global convertHexKey
    .global print_round
    .global print_state_hex_string
    .global print_state_ascii_string

// ================================================================
// Print_round: imprime "===== RONDA n =====\n"  (x0 = n)
// ================================================================
print_round:
    stp x29, x30, [sp, #-32]!
    mov x29, sp
    sub sp, sp, #16
    mov x19, x0

    mov x0, #1
    ldr x1, =hdr_round
    mov x2, lenHdrRound
    mov x8, #64
    svc #0

    cmp x19, #10
    b.lt 1f
    mov w3, #'1' ; strb w3, [sp]
    mov x0, #1 ; mov x1, sp ; mov x2, #1 ; mov x8, #64 ; svc #0
    mov w3, #'0' ; strb w3, [sp]
    mov x0, #1 ; mov x1, sp ; mov x2, #1 ; mov x8, #64 ; svc #0
    b 2f
1:  add w3, w19, #'0' ; strb w3, [sp]
    mov x0, #1 ; mov x1, sp ; mov x2, #1 ; mov x8, #64 ; svc #0
2:  mov x0, #1
    ldr x1, =hdr_round_tail
    mov x2, lenHdrRoundTail
    mov x8, #64
    svc #0

    add sp, sp, #16
    ldp x29, x30, [sp], #32
    ret

// ================================================================
// readTextInput: lee texto (1..16 bytes) y lo carga a Matriz Estado(matState)
// ================================================================
    .type   readTextInput, %function
readTextInput:
    stp x29, x30, [sp, #-16]!
    mov x29, sp
    read 0, buffer, 256
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
    cbz  x3, 8f
    cmp  x3, #16
    b.gt 9f

    ldr x5, =matState
    mov x6, #0
    mov x7, #16
3:  cbz x7, 4f
    strb w6, [x5], #1
    sub  x7, x7, #1
    b    3b
4:
    ldr x1, =buffer
    ldr x2, =matState
    mov x8, #0
5:  cmp x8, x3
    b.ge 7f
    mov  x9, #4
    udiv x10, x8, x9
    msub x11, x10, x9, x8
    mul  x12, x10, x9
    add  x12, x11, x12
    ldrb w13, [x1, x8]
    strb w13, [x2, x12]
    add  x8, x8, #1
    b    5b

7:  mov w0, #0 ; ldp x29, x30, [sp], #16 ; ret
8:  print 1, err_txt_empty, lenErrTxtEmpty ; mov w0, #1 ; ldp x29, x30, [sp], #16 ; ret
9:  print 1, err_txt_len, lenErrTxtLen ; mov w0, #1 ; ldp x29, x30, [sp], #16 ; ret
    .size readTextInput, (. - readTextInput)

// ================================================================
// Helpers HEX
// ================================================================
    .type is_hex_char, %function
is_hex_char:
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
3:  print 1, key_err_msg, lenKeyErr ; mov w0, #0 ; ret
    .size hex_char_to_nibble, (. - hex_char_to_nibble)

// ================================================================
// convertHexKey
// ================================================================
    .type   convertHexKey, %function
convertHexKey:
    stp x29, x30, [sp, #-16]!
    mov x29, sp
    read 0, buffer, 64
    ldr x1, =buffer
    mov x2, #0
    mov x3, #0
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

    ldr x2, =key
    mov x5, #16
    mov w6, #0
3:  cbz x5, 4f
    strb w6, [x2], #1
    sub  x5, x5, #1
    b    3b
4:
    and x4, x3, #1
    mov x19, x3
    cbz x4, 5f
    add x19, x3, #1
5:  lsr x13, x19, #1

    ldr x1, =buffer
    ldr x2, =key
    mov x10, #0
    mov x7,  #0
6:  cmp x10, x13
    b.ge 10f

    cmp x7, x3
    b.lo 11f
    mov w4, #'0'
    b   12f
11: ldrb w4, [x1], #1
12: bl   hex_char_to_nibble
    lsl  w5, w0, #4
    add  x7, x7, #1

    cmp x7, x3
    b.lo 13f
    mov w4, #'0'
    b   14f
13: ldrb w4, [x1], #1
14: bl   hex_char_to_nibble
    orr  w5, w5, w0
    add  x7, x7, #1

    mov  x9, #4
    udiv x11, x10, x9
    msub x12, x11, x9, x10
    mul  x17, x11, x9
    add  x17, x12, x17
    strb w5, [x2, x17]

    add  x10, x10, #1
    b    6b

7:  print 1, err_key_len, lenErrKeyLen ; mov w0, #1 ; ldp x29, x30, [sp], #16 ; ret
8:  print 1, err_key_short, lenErrKeyShort ; mov w0, #1 ; ldp x29, x30, [sp], #16 ; ret
9:  print 1, err_key_char, lenErrKeyChar ; mov w0, #1 ; ldp x29, x30, [sp], #16 ; ret
10: mov w0, #0 ; ldp x29, x30, [sp], #16 ; ret
    .size convertHexKey, (. - convertHexKey)

// ================================================================
// print_hex_byte
// ================================================================
    .type   print_hex_byte, %function
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

// ================================================================
// printMatrix(ptr, msg, len)
// ================================================================
    .type   printMatrix, %function
printMatrix:
    stp x29, x30, [sp, #-32]!
    mov x29, sp
    stp x20, x21, [sp, #16]

    mov x20, x0
    mov x21, x1

    mov x0, #1
    mov x1, x21
    
    mov x8, #64
    svc #0

    mov x23, #0
1:  cmp x23, #4
    b.ge 3f
    mov x24, #0
2:  cmp x24, #4
    b.ge 4f
    mov x25, #4
    mul x25, x24, x25
    add x25, x25, x23
    ldrb w0, [x20, x25]
    bl  print_hex_byte
    add x24, x24, #1
    b   2b
4:  mov x0, #1
    ldr x1, =newline
    mov x2, #1
    mov x8, #64
    svc #0
    add x23, x23, #1
    b   1b
3:  mov x0, #1
    ldr x1, =newline
    mov x2, #1
    mov x8, #64
    svc #0

    ldp x20, x21, [sp, #16]
    ldp x29, x30, [sp], #32
    ret
    .size printMatrix, (. - printMatrix)

// ================================================================
// Print_Matriz: 32 hex
// ================================================================
print_state_hex_string:
    stp x29, x30, [sp, #-32]!
    mov x29, sp
    sub sp, sp, #16
    ldr x20, =matState
    mov x10, #0

1:  cmp x10, #16
    b.ge 3f

    and x11, x10, #3
    lsr x12, x10, #2
    mov x13, #4
    mul x12, x12, x13
    add x25, x11, x12

    ldrb w0, [x20, x25]

    and w1, w0, #0xF0
    lsr w1, w1, #4
    cmp w1, #10
    b.lt 5f
    add w1, w1, #'A' - 10
    b   6f
5:  add w1, w1, #'0'
6:  strb w1, [sp]

    and w2, w0, #0x0F
    cmp w2, #10
    b.lt 7f
    add w2, w2, #'A' - 10
    b   8f
7:  add w2, w2, #'0'
8:  strb w2, [sp, #1]

    mov x0, #1
    mov x1, sp
    mov x2, #2
    mov x8, #64
    svc #0

    add x10, x10, #1
    b   1b

3:  mov x0, #1
    ldr x1, =newline
    mov x2, #1
    mov x8, #64
    svc #0

    add sp, sp, #16
    ldp x29, x30, [sp], #32
    ret

// ================================================================
// Print Matriz a ASCII
// ================================================================
print_state_ascii_string:
    stp x29, x30, [sp, #-16]!
    mov x29, sp
    ldr x20, =matState
    mov x10, #0

1:  cmp x10, #16
    b.ge 2f

    and x11, x10, #3
    lsr x12, x10, #2
    mov x13, #4
    mul x12, x12, x13
    add x25, x11, x12

    ldrb w3, [x20, x25]      
    sub sp, sp, #16
    strb w3, [sp]
    mov x0, #1
    mov x1, sp
    mov x2, #1
    mov x8, #64
    svc #0
    add sp, sp, #16

    add x10, x10, #1
    b   1b

2:  mov x0, #1
    ldr x1, =newline
    mov x2, #1
    mov x8, #64
    svc #0

    ldp x29, x30, [sp], #16
    ret

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

    // === Generar subclaves (0 a 10) ===
    bl  keyExpansion

    // Mostrar Subclave 0
    ldr x0, =roundKeys
    ldr x1, =debug_key
    mov x2, lenDebugKey
    bl  printMatrix

    // === Paso 0: AddRoundKey inicial (subclave 0) ===
    print 1, hdr_step0, lenHdrStep0
    ldr x0, =matState
    ldr x1, =roundKeys              // &roundKeys[0]
    bl  addRoundKey

    // Estado tras Paso 0
    ldr x0, =matState
    ldr x1, =debug_state
    mov x2, lenDebugState
    bl  printMatrix

    // ==================== RONDAS 1 a 9 ====================
    ldr x22, =roundKeys
    mov x21, #1

    // ====================== Bucle Rondas ==================
round_loop:
    cmp x21, #10
    b.ge last_round

    mov x0, x21
    bl  print_round

    print 1, hdr_step1, lenHdrStep1
    bl  subBytes
    ldr x0, =matState
    ldr x1, =debug_state
    mov x2, lenDebugState
    bl  printMatrix

    print 1, hdr_step2, lenHdrStep2
    bl  shiftRows
    ldr x0, =matState
    ldr x1, =debug_state
    mov x2, lenDebugState
    bl  printMatrix

    print 1, hdr_step3, lenHdrStep3
    bl  mixColumns
    ldr x0, =matState
    ldr x1, =debug_state
    mov x2, lenDebugState
    bl  printMatrix

    // Subclave de la ronda actual
    mov x9, x21
    lsl x9, x9, #4
    add x20, x22, x9
    mov x0, x20
    ldr x1, =hdr_subkey
    mov x2, lenHdrSubkey
    bl  printMatrix

    // Paso 4
    print 1, hdr_step4, lenHdrStep4
    ldr x0, =matState
    mov x1, x20
    bl  addRoundKey

    // Estado tras Paso 4
    ldr x0, =matState
    ldr x1, =debug_state
    mov x2, lenDebugState
    bl  printMatrix

    add x21, x21, #1
    b   round_loop

// ==================== RONDA 10 ====================
last_round:
    mov x0, #10
    bl  print_round

    print 1, hdr_step1, lenHdrStep1
    bl  subBytes
    ldr x0, =matState
    ldr x1, =debug_state
    mov x2, lenDebugState
    bl  printMatrix

    print 1, hdr_step2, lenHdrStep2
    bl  shiftRows
    ldr x0, =matState
    ldr x1, =debug_state
    mov x2, lenDebugState
    bl  printMatrix

    // Subclave 10
    mov x9, #10
    lsl x9, x9, #4
    ldr x22, =roundKeys
    add x20, x22, x9
    mov x0, x20
    ldr x1, =hdr_subkey
    mov x2, lenHdrSubkey
    bl  printMatrix

    print 1, hdr_step4, lenHdrStep4
    ldr x0, =matState
    mov x1, x20
    bl  addRoundKey

    // Print: AddRoundKey Ronda 10 Paso 4:
    ldr x0, =matState
    ldr x1, =debug_state
    mov x2, lenDebugState
    bl  printMatrix

    // ====== COPIA RESULTADO FINAL EN MATRIZ ======
    ldr x0, =matState
    ldr x1, =result_banner_top
    mov x2, lenBannerTop
    bl  printMatrix

    // ====== TEXTO EN STRING ======
    print 1, ascii_banner, lenAsciiBanner
    bl  print_state_ascii_string

    // Salida
    mov x0, #0
    mov x8, #93
    svc #0

    .size _start, (. - _start)
