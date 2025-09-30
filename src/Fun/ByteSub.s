// ======================= ByteSub.s (AArch64) =======================
// AES SubBytes: matState[i] = Sbox[ matState[i] ]

    .text
    .global subBytes
    .type   subBytes, %function
    .extern matState
    .extern Sbox

subBytes:
    // Prólogo
    stp x29, x30, [sp, #-32]!
    mov x29, sp
    stp x19, x20, [sp, #16]

    ldr x19, =matState
    ldr x20, =Sbox
    mov x0, #0
1:  cmp x0, #16
    b.ge 2f
    ldrb w1, [x19, x0]     // byte actual
    uxtw x1, w1            // índice 0..255
    ldrb w2, [x20, x1]     // Sbox[byte]
    strb w2, [x19, x0]
    add x0, x0, #1
    b 1b

2:  // Epílogo
    ldp x19, x20, [sp, #16]
    ldp x29, x30, [sp], #32
    ret

    .size subBytes, (. - subBytes)