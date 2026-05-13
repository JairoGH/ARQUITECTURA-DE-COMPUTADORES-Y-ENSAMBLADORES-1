/*  == main.s === 
    == @author Jairo Gomez ==
    == 201902672 ==
*/

    .section .data
    .global newline
newline:                .asciz "\n"

/* ===== Mensajes de Consola ===== */

msg_txt:                .asciz "Ingrese el texto a cifrar (Maximo 16 caracteres): "
lenMsgTxt = . - msg_txt

msg_key:                .asciz "Ingrese la clave (Maximo 32 Hexadecimales): "
lenMsgKey = . - msg_key

key_err_msg:            .asciz "Error: Valor de clave incorrecto\n"
lenKeyErr = . - key_err_msg

/* ===== Encabezados de depuracion ===== */
debug_state:            .asciz "Matriz de Estado:\n"
lenDebugState = . - debug_state

debug_key:              .asciz "Matriz de Clave:\n"
lenDebugKey = . - debug_key

// ---- ENCABEZADOS FLUJO AES ----
hdr_step0:              .asciz "Paso 0: AddRoundKey inicial:\n"
lenHdrStep0    = . - hdr_step0

// Encabezado de ronda (se imprime "RONDA n")
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

// ---- INFO ESTUDIANTE ----
student_title:      .asciz "\n===== INFORMACION DEL ESTUDIANTE =====\n"
lenStudentTitle = . - student_title
student_name:       .asciz "Nombre : Jairo Gomez\n"
lenStudentName = . - student_name
student_carnet:     .asciz "Carnet : 201902672\n"
lenStudentCarnet = . - student_carnet
course_info:        .asciz "Curso  : Arquitectura de Computadores y Ensambladores 1 \n"
lenCourseInfo = . - course_info
project_info:       .asciz "Proyecto: Algoritmo de encriptacion AES-128 \n"
lenProjectInfo = . - project_info

// ---- MENSAJE DE TIEMPO ----
time_msg:           .asciz "Tiempo de ejecucion: "
lenTimeMsg = . - time_msg
sec_label:          .asciz " segundos, "
lenSecLabel = . - sec_label
nsec_label:         .asciz " nanosegundos\n"
lenNsecLabel = . - nsec_label

// -----------------------------------------------------------------
// .bss: buffers, estado AES y timespec
// -----------------------------------------------------------------
    .section .bss
    .align 4

    .global matState
matState:               .space 16, 0     // Estado AES 16B (column-major: c*4 + r)

    .global key
key:                    .space 16, 0     // Clave activa 128-bit (column-major)

buffer:                 .space 256, 0    // Buffer de entrada general (texto | clave)
temp_buffer:            .space 64, 0     // Auxiliar

// ---- timespec para clock_gettime ----
// struct timespec { i64 tv_sec; i64 tv_nsec; } (AArch64 Linux)
ts_start:               .space 16, 0
ts_end:                 .space 16, 0

// Buffer para imprimir enteros decimales (hasta 20 dígitos)
decbuf:                 .space 32, 0

// -----------------------------------------------------------------
    .section .text

/* ===========================================================
   SYSCALL helpers (write/read)
   print fd, buffer, len  -> write(fd, &buffer, len)
   read  fd, buffer, len  -> read(fd, &buffer, len)
   ===========================================================*/
.macro print fd, buffer, len
    mov x0, \fd
    ldr x1, =\buffer
    mov x2, \len
    mov x8, #64          // __NR_write
    svc #0
.endm

.macro read fd, buffer, len
    mov x0, \fd
    ldr x1, =\buffer
    mov x2, \len
    mov x8, #63          // __NR_read
    svc #0
.endm

// ========== Funciones externas ==========
    .extern addRoundKey      
    .extern subBytes     
    .extern shiftRows     
    .extern mixColumns      
    .extern keyExpansion     
    .extern roundKeys
    .extern menu_loop         

// ========== Simbolos exportados ==========
    .global print_hex_byte
    .global printMatrix
    .global readTextInput
    .global convertHexKey
    .global print_round
    .global print_state_hex_string
    .global print_state_ascii_string
    .global print_u64
    .global print_elapsed_time
    .global start_encryption
    .global print_student_info
    .global _start

/* ===========================================================
   print_round
   x0 = número de ronda (1..10)
   Escribe " ========== RONDA n ==========\n"
   ===========================================================*/
print_round:
    stp x29, x30, [sp, #-32]!
    mov x29, sp
    sub sp, sp, #16
    mov x19, x0                 // guardar 'n' de ronda

    // " ========== RONDA "
    mov x0, #1
    ldr x1, =hdr_round
    mov x2, lenHdrRound
    mov x8, #64
    svc #0

    // imprime 'n' (1 dígito o "10")
    cmp x19, #10
    b.lt 1f
    mov w3, #'1' ; strb w3, [sp]
    mov x0, #1 ; mov x1, sp ; mov x2, #1 ; mov x8, #64 ; svc #0
    mov w3, #'0' ; strb w3, [sp]
    mov x0, #1 ; mov x1, sp ; mov x2, #1 ; mov x8, #64 ; svc #0
    b 2f
1:  add w3, w19, #'0' ; strb w3, [sp]
    mov x0, #1 ; mov x1, sp ; mov x2, #1 ; mov x8, #64 ; svc #0
2:
    // " ========== \n"
    mov x0, #1
    ldr x1, =hdr_round_tail
    mov x2, lenHdrRoundTail
    mov x8, #64
    svc #0

    add sp, sp, #16
    ldp x29, x30, [sp], #32
    ret

/* ===========================================================
   readTextInput
   Limpia y escribe matState con 1..16 bytes en column-major
   ===========================================================*/
    .type   readTextInput, %function
readTextInput:
    stp x29, x30, [sp, #-16]!
    mov x29, sp

    // leer línea del usuario a 'buffer'
    read 0, buffer, 256

    // medir longitud hasta '\n' o NUL
    ldr x1, =buffer
    mov x2, #0            // idx lectura
    mov x3, #0            // len efectiva
1:  ldrb w4, [x1, x2]
    cbz  w4, 2f           // NUL => fin
    cmp  w4, #10          // '\n' => fin
    b.eq 2f
    add  x2, x2, #1
    add  x3, x3, #1
    b    1b

2:  // validar tamaño 1..16
    cbz  x3, 8f
    cmp  x3, #16
    b.gt 9f

    // limpiar matState a 0
    ldr x5, =matState
    mov x6, #0
    mov x7, #16
3:  cbz x7, 4f
    strb w6, [x5], #1
    sub  x7, x7, #1
    b    3b

4:  // mapear buffer -> matState en column-major
    ldr x1, =buffer
    ldr x2, =matState
    mov x8, #0
5:  cmp x8, x3
    b.ge 7f

    // idxCM = (x8/4)*4 + (x8%4)
    mov  x9, #4
    udiv x10, x8, x9              // q = x8/4
    msub x11, x10, x9, x8         // r = x8 - q*4 = x8%4
    mul  x12, x10, x9             // q*4
    add  x12, x11, x12            // idxCM
    ldrb w13, [x1, x8]
    strb w13, [x2, x12]
    add  x8, x8, #1
    b    5b

7:  mov w0, #0                    // OK
    ldp x29, x30, [sp], #16
    ret

8:  // error: vacío
    print 1, err_txt_empty, lenErrTxtEmpty
    mov w0, #1
    ldp x29, x30, [sp], #16
    ret

9:  // error: > 16
    print 1, err_txt_len, lenErrTxtLen
    mov w0, #1
    ldp x29, x30, [sp], #16
    ret
    .size readTextInput, (. - readTextInput)

/* ===========================================================
   is_hex_char / hex_char_to_nibble
   Función: validar dígito hex y convertirlo a nibble [0..15]
   ===========================================================*/
    .type is_hex_char, %function
is_hex_char:
    cmp w4, #'0' ; b.lt 1f
    cmp w4, #'9' ; b.le 2f
    orr w4, w4, #0x20        // a..f (normaliza a minúscula)
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
3:  print 1, key_err_msg, lenKeyErr
    mov w0, #0
    ret
    .size hex_char_to_nibble, (. - hex_char_to_nibble)

/* ===========================================================
   convertHexKey
   Lee cadena HEX (0..32 nibbles) y construye key[16] (column-major).
   ===========================================================*/
    .type   convertHexKey, %function
convertHexKey:
    stp x29, x30, [sp, #-16]!
    mov x29, sp

    read 0, buffer, 64            // leer línea de clave
    ldr x1, =buffer
    mov x2, #0                    // idx lectura
    mov x3, #0                    // cuenta de dígitos hex válidos

// contar hex válidos hasta '\n' / NUL con validación por char
1:  ldrb w4, [x1, x2]
    cbz  w4, 2f
    cmp  w4, #10
    b.eq 2f
    bl   is_hex_char
    cmp  w0, #1
    b.ne 9f                       // si no es hex -> error
    add  x3, x3, #1
    add  x2, x2, #1
    b    1b

2:  // validaciones de longitud
    cbz  x3, 8f                   // vacío
    cmp  x3, #32
    b.gt 7f                       // >32 nibbles (más de 16 bytes)

    // limpiar key a 0
    ldr x2, =key
    mov x5, #16
    mov w6, #0
3:  cbz x5, 4f
    strb w6, [x2], #1
    sub  x5, x5, #1
    b    3b

4:  // si #nibbles impar, “padding” con '0' a la izquierda del primer byte
    and x4, x3, #1
    mov x19, x3
    cbz x4, 5f
    add x19, x3, #1               // 3 nibbles -> trata 4
5:  lsr x13, x19, #1              // #bytes a construir

    // reconvertir desde buffer -> key en column-major
    ldr x1, =buffer
    ldr x2, =key
    mov x10, #0                   // i byte (0..bytes-1)
    mov x7,  #0                   // nibbles consumidos reales
6:  cmp x10, x13
    b.ge 10f                      // fin

    // nibble alto
    cmp x7, x3
    b.lo 11f
    mov w4, #'0'                  // si faltó nibble se usa '0'
    b   12f
11: ldrb w4, [x1], #1
12: bl   hex_char_to_nibble
    lsl  w5, w0, #4               // high << 4
    add  x7, x7, #1

    // nibble bajo
    cmp x7, x3
    b.lo 13f
    mov w4, #'0'
    b   14f
13: ldrb w4, [x1], #1
14: bl   hex_char_to_nibble
    orr  w5, w5, w0               // byte = hi|lo
    add  x7, x7, #1

    // calcular índice column-major y guardar
    mov  x9, #4
    udiv x11, x10, x9
    msub x12, x11, x9, x10
    mul  x17, x11, x9
    add  x17, x12, x17
    strb w5, [x2, x17]

    add  x10, x10, #1
    b    6b

7:  print 1, err_key_len,   lenErrKeyLen   ; mov w0, #1 ; ldp x29, x30, [sp], #16 ; ret
8:  print 1, err_key_short, lenErrKeyShort ; mov w0, #1 ; ldp x29, x30, [sp], #16 ; ret
9:  print 1, err_key_char,  lenErrKeyChar  ; mov w0, #1 ; ldp x29, x30, [sp], #16 ; ret
10: mov w0, #0
    ldp x29, x30, [sp], #16
    ret
    .size convertHexKey, (. - convertHexKey)

/* ===========================================================
   print_hex_byte
   Imprime un byte (w0) en hexadecimal "HH".
   ===========================================================*/
    .type   print_hex_byte, %function
print_hex_byte:
    stp x29, x30, [sp, #-16]!
    mov x29, sp
    // separar nibble alto/bajo
    and w1, w0, #0xF0
    lsr w1, w1, #4
    and w2, w0, #0x0F
    // convertir a ASCII
    cmp w1, #10 ; b.lt 1f
    add w1, w1, #'A' - 10 ; b 2f
1:  add w1, w1, #'0'
2:  cmp w2, #10 ; b.lt 3f
    add w2, w2, #'A' - 10 ; b 4f
3:  add w2, w2, #'0'
4:  // buffer temporal en stack: "HH ' '"
    sub sp, sp, #16
    strb w1, [sp]
    strb w2, [sp, #1]
    mov  w3, #' '
    strb w3, [sp, #2]
    // write(1, sp, 3)
    mov x0, #1
    mov x1, sp
    mov x2, #3
    mov x8, #64
    svc #0
    add sp, sp, #16
    ldp x29, x30, [sp], #16
    ret
    .size print_hex_byte, (. - print_hex_byte)

/* ===========================================================
   printMatrix(ptr, msg, len)
   Imprime cabecera msg y la matriz 4x4 en hex, asumiendo column-major.
   ===========================================================*/
    .type   printMatrix, %function
printMatrix:
    stp x29, x30, [sp, #-32]!
    mov x29, sp
    stp x20, x21, [sp, #16]

    mov x20, x0          // matriz
    mov x21, x1          // mensaje

    // imprime encabezado
    mov x0, #1
    mov x1, x21
    mov x8, #64
    svc #0

    // recorrer por filas lógicas (r=0..3) y columnas (c=0..3)
    mov x23, #0
1:  cmp x23, #4
    b.ge 3f
    mov x24, #0
2:  cmp x24, #4
    b.ge 4f
    // idx = c*4 + r (column-major)
    mov x25, #4
    mul x25, x24, x25
    add x25, x25, x23
    ldrb w0, [x20, x25]
    bl  print_hex_byte
    add x24, x24, #1
    b   2b

4:  // salto de línea por fila
    mov x0, #1
    ldr x1, =newline
    mov x2, #1
    mov x8, #64
    svc #0
    add x23, x23, #1
    b   1b

3:  // línea extra al final
    mov x0, #1
    ldr x1, =newline
    mov x2, #1
    mov x8, #64
    svc #0

    ldp x20, x21, [sp, #16]
    ldp x29, x30, [sp], #32
    ret
    .size printMatrix, (. - printMatrix)

/* ===========================================================
   print_state_hex_string
   Imprime matState como 32 hex contiguos (column-major).
   ===========================================================*/
print_state_hex_string:
    stp x29, x30, [sp, #-32]!
    mov x29, sp
    sub sp, sp, #16
    ldr x20, =matState
    mov x10, #0
1:  cmp x10, #16
    b.ge 3f
    // map x10 -> idx column-major
    and x11, x10, #3
    lsr x12, x10, #2
    mov x13, #4
    mul x12, x12, x13
    add x25, x11, x12
    // byte -> dos dígitos hex
    ldrb w0, [x20, x25]
    and w1, w0, #0xF0 ; lsr w1, w1, #4
    cmp w1, #10 ; b.lt 5f
    add w1, w1, #'A' - 10 ; b 6f
5:  add w1, w1, #'0'
6:  strb w1, [sp]
    and w2, w0, #0x0F
    cmp w2, #10 ; b.lt 7f
    add w2, w2, #'A' - 10 ; b 8f
7:  add w2, w2, #'0'
8:  strb w2, [sp, #1]
    mov x0, #1 ; mov x1, sp ; mov x2, #2 ; mov x8, #64 ; svc #0
    add x10, x10, #1
    b   1b
3:  // newline
    mov x0, #1
    ldr x1, =newline
    mov x2, #1
    mov x8, #64 
    svc #0 
    add sp, sp, #16
    ldp x29, x30, [sp], #32
    ret

/* ===========================================================
   print_state_ascii_string
   Imprime matState como 16 chars ASCII (column-major).
   ===========================================================*/
print_state_ascii_string:
    stp x29, x30, [sp, #-16]!
    mov x29, sp
    ldr x20, =matState
    mov x10, #0
1:  cmp x10, #16
    b.ge 2f
    // idx column-major
    and x11, x10, #3
    lsr x12, x10, #2
    mov x13, #4
    mul x12, x12, x13
    add x25, x11, x12

    // escribir un byte directo a stdout
    ldrb w3, [x20, x25]      
    sub sp, sp, #16
    strb w3, [sp]
    mov x0, #1 ; mov x1, sp ; mov x2, #1 ; mov x8, #64 ; svc #0
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

/* ===========================================================
   print_u64
   Imprime un entero sin signo (x0) en decimal.
   ===========================================================*/
    .type print_u64, %function
print_u64:
    stp x29, x30, [sp, #-32]!
    mov x29, sp
    stp x19, x20, [sp, #16]

    mov x19, x0                 // valor
    ldr x20, =decbuf
    add x20, x20, #31           // puntero desde el final
    mov w1, #'0'

    cbz x19, 2f
1:  mov x2, #10
    udiv x3, x19, x2
    msub x4, x3, x2, x19        // x4 = x19 - x3*10  (resto)
    add w4, w4, #'0'
    strb w4, [x20], #-1
    mov x19, x3
    cbnz x19, 1b
    b 3f
2:  strb w1, [x20], #-1
3:  add x20, x20, #1
    mov x0, #1
    mov x1, x20
    ldr x5, =decbuf
    add x5, x5, #32
    sub x2, x5, x20             // longitud a imprimir
    mov x8, #64
    svc #0

    ldp x19, x20, [sp, #16]
    ldp x29, x30, [sp], #32
    ret
    .size print_u64, (. - print_u64)

/* ===========================================================
   print_elapsed_time
   ===========================================================*/
    .type print_elapsed_time, %function
print_elapsed_time:
    stp x29, x30, [sp, #-32]!
    mov x29, sp
    stp x19, x20, [sp, #16]

    ldr x19, =ts_start
    ldr x20, =ts_end

    // cargar timespec fin/inicio
    ldr x6, [x20]       // sec2
    ldr x7, [x20, #8]   // nsec2
    ldr x4, [x19]       // sec1
    ldr x5, [x19, #8]   // nsec1

    // delta
    sub  x6, x6, x4     // dsec
    subs x7, x7, x5     // dnsec
    b.pl 1f
    ldr  x9, =1000000000
    add  x7, x7, x9
    sub  x6, x6, #1
1:
    print 1, time_msg, lenTimeMsg
    mov x0, x6
    bl  print_u64
    print 1, sec_label, lenSecLabel
    mov x0, x7
    bl  print_u64
    print 1, nsec_label, lenNsecLabel

    ldp x19, x20, [sp, #16]
    ldp x29, x30, [sp], #32
    ret
    .size print_elapsed_time, (. - print_elapsed_time)

/* ===========================================================
   print_student_info
   ===========================================================*/
    .type   print_student_info, %function
print_student_info:
    stp x29, x30, [sp, #-16]!
    mov x29, sp

    mov x0, #1 ; ldr x1, =student_title ; mov x2, lenStudentTitle ; mov x8, #64 ; svc #0
    mov x0, #1 ; ldr x1, =student_name  ; mov x2, lenStudentName  ; mov x8, #64 ; svc #0
    mov x0, #1 ; ldr x1, =student_carnet; mov x2, lenStudentCarnet; mov x8, #64 ; svc #0
    mov x0, #1 ; ldr x1, =course_info   ; mov x2, lenCourseInfo   ; mov x8, #64 ; svc #0
    mov x0, #1 ; ldr x1, =project_info  ; mov x2, lenProjectInfo  ; mov x8, #64 ; svc #0

    ldp x29, x30, [sp], #16
    ret
    .size print_student_info, (. - print_student_info)

/* ===========================================================
   start_encryption
   Flujo de cifrado, Además imprime estado/subclaves y resultado final (hex y ASCII).
   ===========================================================*/
    .type   start_encryption, %function
start_encryption:
// 1) Leer texto de Entrada
txt_retry:
    print 1, msg_txt, lenMsgTxt
    bl   readTextInput
    cmp  w0, #0
    b.ne txt_retry

    // Estado inicial (opcional para depurar)
    ldr x0, =matState
    ldr x1, =debug_state
    mov x2, lenDebugState
    bl  printMatrix

// 2) Leer clave hex de Entrada
key_retry:
    print 1, msg_key, lenMsgKey
    bl   convertHexKey
    cmp  w0, #0
    b.ne key_retry

    // 3) Key Expansion
    // Generar subclaves 0..10
    bl  keyExpansion

    // Mostrar Subclave 0 (opcional)
    ldr x0, =roundKeys
    ldr x1, =debug_key
    mov x2, lenDebugKey
    bl  printMatrix

    // ================== INICIO DE MEDICIÓN ==================
    // clock_gettime(CLOCK_MONOTONIC=1, &ts_start)
    mov x0, #1
    ldr x1, =ts_start
    mov x8, #113                 // __NR_clock_gettime
    svc #0
    // ========================================================

    // 4) AddRoundKey inicial
    // Paso 0: AddRoundKey inicial (subclave 0)
    print 1, hdr_step0, lenHdrStep0
    ldr x0, =matState
    ldr x1, =roundKeys
    bl  addRoundKey

    // Estado tras Paso 0
    ldr x0, =matState
    ldr x1, =debug_state
    mov x2, lenDebugState
    bl  printMatrix

    // ==================== RONDAS 1 a 9 ====================
    ldr x22, =roundKeys
    mov x21, #1
// Bucle de rondas
round_loop:
    cmp x21, #10 // <- Compara si es igual a 10, si lo es salta a la última ronda
    b.ge last_round

    // Encabezado "RONDA n"
    mov x0, x21
    bl  print_round

    // Paso 1: SubBytes
    print 1, hdr_step1, lenHdrStep1
    bl  subBytes
    ldr x0, =matState ; ldr x1, =debug_state ; mov x2, lenDebugState
    bl  printMatrix

    // Paso 2: ShiftRows
    print 1, hdr_step2, lenHdrStep2
    bl  shiftRows
    ldr x0, =matState ; ldr x1, =debug_state ; mov x2, lenDebugState
    bl  printMatrix

    // Paso 3: MixColumns
    print 1, hdr_step3, lenHdrStep3
    bl  mixColumns
    ldr x0, =matState ; ldr x1, =debug_state ; mov x2, lenDebugState
    bl  printMatrix

    // Subclave de la ronda (16*round = <<4)
    mov x9, x21
    lsl x9, x9, #4
    add x20, x22, x9               // x20 = &roundKeys[round]
    // Mostrar subclave usada
    mov x0, x20 ; ldr x1, =hdr_subkey ; mov x2, lenHdrSubkey
    bl  printMatrix

    // Paso 4: AddRoundKey
    print 1, hdr_step4, lenHdrStep4
    ldr x0, =matState
    mov x1, x20
    bl  addRoundKey

    // Estado tras Paso 4 
    ldr x0, =matState ; ldr x1, =debug_state ; mov x2, lenDebugState
    bl  printMatrix

    add x21, x21, #1
    b   round_loop

// ==================== RONDA 10 ====================
// Ultima ronda 10, SubBytes -> ShiftRows -> AddRoundKey
last_round:
    mov x0, #10
    bl  print_round

    // SubBytes
    print 1, hdr_step1, lenHdrStep1
    bl  subBytes
    ldr x0, =matState ; ldr x1, =debug_state ; mov x2, lenDebugState
    bl  printMatrix

    // ShiftRows
    print 1, hdr_step2, lenHdrStep2
    bl  shiftRows
    ldr x0, =matState ; ldr x1, =debug_state ; mov x2, lenDebugState
    bl  printMatrix

    // Subclave 10
    mov x9, #10
    lsl x9, x9, #4
    ldr x22, =roundKeys
    add x20, x22, x9

    // Mostrar subclave 10
    mov x0, x20 ; ldr x1, =hdr_subkey ; mov x2, lenHdrSubkey
    bl  printMatrix

    // AddRoundKey final
    print 1, hdr_step4, lenHdrStep4
    ldr x0, =matState
    mov x1, x20
    bl  addRoundKey

    // Estado final (hex matricial)
    ldr x0, =matState
    ldr x1, =result_banner_top
    mov x2, lenBannerTop
    bl  printMatrix

    // Cadena ASCII resultante
    print 1, ascii_banner, lenAsciiBanner
    bl  print_state_ascii_string

    // =================== FIN DE MEDICION ====================
    // clock_gettime(CLOCK_MONOTONIC=1, &ts_end)
    mov x0, #1
    ldr x1, =ts_end
    mov x8, #113
    svc #0

    // Imprimir Δt
    bl  print_elapsed_time

    ret
    .size start_encryption, (. - start_encryption)

/* ===========================================================
   _start  (Entry Point)
   -----------------------------------------------------------
   Entrega el control al menú (Fun/Menu.s). Si retorna, salir con exit(0).
   ===========================================================*/
    .type   _start, %function
_start:
    bl  menu_loop
    // Si por alguna razón retorna, salir limpio
    mov x0, #0
    mov x8, #93          // __NR_exit
    svc #0
    .size _start, (. - _start)
