// ======================= AddRoundKey (parametrizado) =======================
    .text
    .global addRoundKey
    .type   addRoundKey, %function
    .extern matState

// Uso:
//   x0 = &matState (opcional, se puede ignorar porque es global)
//   x1 = &subclave de 16 bytes dentro de roundKeys
addRoundKey:
    // Prólogo
    stp x29, x30, [sp, #-32]!
    mov x29, sp
    stp x19, x20, [sp, #16]

    ldr x19, =matState     // puntero al estado
    mov x20, x1            // puntero a la subclave
    mov x0, #0
1:  cmp x0, #16
    b.ge 2f
    ldrb w1, [x19, x0]
    ldrb w2, [x20, x0]
    eor  w3, w1, w2
    strb w3, [x19, x0]
    add x0, x0, #1
    b    1b

2:  // Epílogo
    ldp x19, x20, [sp, #16]
    ldp x29, x30, [sp], #32
    ret

    .size addRoundKey, (. - addRoundKey)
