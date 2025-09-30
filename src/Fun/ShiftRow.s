// ======================= ShiftRow ========================

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
    mov x0, #0                    // x0 = fila (r)
1:
    cmp x0, #4
    b.ge 9f

    // Direcciones de la fila r en column-major:
    // addr0 = base + (r + 0*4), addr1 = base + (r + 1*4), ...
    add x9,  x19, x0              // addr0 = base + r
    add x10, x9,  #4              // addr1 = base + r + 4
    add x11, x9,  #8              // addr2 = base + r + 8
    add x12, x9,  #12             // addr3 = base + r + 12

    // Cargar los 4 bytes de la fila (b0, b1, b2, b3)
    ldrb w3, [x9]                 // b0 = state[r + 0*4]
    ldrb w4, [x10]                // b1 = state[r + 1*4]
    ldrb w5, [x11]                // b2 = state[r + 2*4]
    ldrb w6, [x12]                // b3 = state[r + 3*4]

    // Selección según nº de rotaciones = fila (r)
    cbz x0, 2f                    // fila 0 -> sin cambios
    cmp x0, #1
    beq 3f                        // fila 1 -> left 1
    cmp x0, #2
    beq 4f                        // fila 2 -> left 2
    // fila 3 -> left 3
5:
    // left 3: [b3, b0, b1, b2]
    strb w6, [x9]
    strb w3, [x10]
    strb w4, [x11]
    strb w5, [x12]
    b   8f

2:
    // Fila 0: no hacer nada  [b0, b1, b2, b3]
    strb w3, [x9]
    strb w4, [x10]
    strb w5, [x11]
    strb w6, [x12]
    b   8f

3:
    // Fila 1: left 1 -> [b1, b2, b3, b0]
    strb w4, [x9]
    strb w5, [x10]
    strb w6, [x11]
    strb w3, [x12]
    b   8f

4:
    // Fila 2: left 2 -> [b2, b3, b0, b1]
    strb w5, [x9]
    strb w6, [x10]
    strb w3, [x11]
    strb w4, [x12]
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
