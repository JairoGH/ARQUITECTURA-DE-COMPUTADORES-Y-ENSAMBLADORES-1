// ======================= ShiftRow =======================
    .text
    .global shiftRows
    .type   shiftRows, %function
    .extern matState           

// ShiftRows: realiza las rotaciones por fila (0..3)

shiftRows:
    // Reserva espacio y guarda FP/LR
    stp x29, x30, [sp, #-32]!     
    mov x29, sp
    // Guarda registros temporales que se usaran dentro de la funcion.
    stp x19, x20, [sp, #16]

    // Cargar dirección base del estado
    ldr x19, =matState            

    // Bucle, Cada iteración manipula una fila (0..3).
    mov x0, #0

1:                    
    cmp x0, #4                    // Comprobar si ya se procesaron las 4 filas
    b.ge 9f                    

    // Calcular las direcciones de los 4 elementos de la fila actual
    add x9,  x19, x0              // byte fila r, col 0
    add x10, x9,  #4              // byte fila r, col 1
    add x11, x9,  #8              // byte fila r, col 2
    add x12, x9,  #12             // byte fila r, col 3

    // Cargar los 4 bytes de la fila actual
    ldrb w3, [x9]                 // b0
    ldrb w4, [x10]                // b1
    ldrb w5, [x11]                // b2
    ldrb w6, [x12]                // b3

    cbz x0, 2f                    // Fila 0 → sin cambio
    cmp x0, #1
    beq 3f                        // Fila 1 → left 1
    cmp x0, #2
    beq 4f                        // Fila 2 → left 2
5:
    // Fila 3: rotar 3 a la izquierda
    //  [b0, b1, b2, b3] → [b3, b0, b1, b2]
    strb w6, [x9]
    strb w3, [x10]
    strb w4, [x11]
    strb w5, [x12]
    b   8f

2:
    // Fila 0: sin cambio
    //  [b0, b1, b2, b3]
    strb w3, [x9]
    strb w4, [x10]
    strb w5, [x11]
    strb w6, [x12]
    b   8f

3:
    // Fila 1: rotar 1 a la izquierda
    //  [b0, b1, b2, b3] → [b1, b2, b3, b0]
    strb w4, [x9]
    strb w5, [x10]
    strb w6, [x11]
    strb w3, [x12]
    b   8f

4:
    // Fila 2: rotar 2 a la izquierda
    //  [b0, b1, b2, b3] → [b2, b3, b0, b1]
    strb w5, [x9]
    strb w6, [x10]
    strb w3, [x11]
    strb w4, [x12]
    b   8f

8:
    // Incrementar fila y continuar con la siguiente
    add x0, x0, #1
    b   1b

9:
    // Restaurar registros y retornar
    ldp x19, x20, [sp, #16]
    ldp x29, x30, [sp], #32
    ret

    .size shiftRows, (. - shiftRows)
