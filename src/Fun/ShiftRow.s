// ======================= ShiftRow =======================

    .text
    .global shiftRows
    .type   shiftRows, %function
    .extern matState

shiftRows:
    // Prólogo
    stp x29, x30, [sp, #-32]!
    mov x29, sp
    stp x19, x20, [sp, #16]

    // x19 = &matState
    ldr x19, =matState

    // Recorre filas 0..3
    mov x0, #0                    // x0 = fila
1:
    cmp x0, #4
    b.ge 9f

    // base = &matState + fila*4
    lsl x1, x0, #2                // x1 = fila*4
    add x20, x19, x1              // x20 = base fila

    // Cargar los 4 bytes de la fila (b0, b1, b2, b3)
    ldrb w3, [x20, #0]            
    ldrb w4, [x20, #1]            
    ldrb w5, [x20, #2]            
    ldrb w6, [x20, #3]            

    // Selección según nº de rotaciones = fila
    cbz x0, 2f                    // fila 0 -> sin cambios
    cmp x0, #1
    beq 3f                        // fila 1 -> left 1
    cmp x0, #2
    beq 4f                        // fila 2 -> left 2
    
5:
    // [b3, b0, b1, b2]
    strb w6, [x20, #0]
    strb w3, [x20, #1]
    strb w4, [x20, #2]
    strb w5, [x20, #3]
    b   8f

2:
    // Fila 0: no hacer nada
    b   8f

3:
    // Fila 1: left 1 -> b1, b2, b3, b0
    strb w4, [x20, #0]
    strb w5, [x20, #1]
    strb w6, [x20, #2]
    strb w3, [x20, #3]
    b   8f

4:
    // Fila 2: left 2 -> b2, b3, b0, b1
    strb w5, [x20, #0]
    strb w6, [x20, #1]
    strb w3, [x20, #2]
    strb w4, [x20, #3]
    b   8f

8:
    add x0, x0, #1
    b   1b

9:
    // Epílogo
    ldp x19, x20, [sp, #16]
    ldp x29, x30, [sp], #32
    ret

    .size shiftRows, (. - shiftRows)
