// ======================= AddRoundKey.s (AArch64) =======================
// AES AddRoundKey: matState[i] ^= key[i] (i=0..15)

    .text
    .global addRoundKey
    .type   addRoundKey, %function
    .extern matState
    .extern key

addRoundKey:
    // Prólogo
    stp x29, x30, [sp, #-32]!
    mov x29, sp
    stp x19, x20, [sp, #16]

    ldr x19, =matState
    ldr x20, =key
    mov x0, #0
1:  cmp x0, #16
    b.ge 2f
    ldrb w1, [x19, x0]
    ldrb w2, [x20, x0]
    eor  w3, w1, w2
    strb w3, [x19, x0]
    add x0, x0, #1
    b 1b

2:  // Epílogo
    ldp x19, x20, [sp, #16]
    ldp x29, x30, [sp], #32
    ret

    .size addRoundKey, (. - addRoundKey)