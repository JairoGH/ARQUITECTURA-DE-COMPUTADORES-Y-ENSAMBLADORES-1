// ======================= MixColumns =======================

    .text
    .global mixColumns
    .global MixColumns
    .type   mixColumns, %function

    .extern matState
    .extern MixColMat

mixColumns:
MixColumns:
    // Prólogo: preservar callee-saved
    stp x29, x30, [sp, #-64]!
    mov x29, sp
    stp x19, x20, [sp, #16]
    stp x21, x22, [sp, #32]
    stp x23, x24, [sp, #48]

    // Bases
    ldr x19, =matState
    ldr x20, =MixColMat

    // col = 0..3
    mov x21, #0

col_loop:
    cmp x21, #4
    b.ge end_mc

    // base de la columna
    lsl  x22, x21, #2              // col*4
    add  x23, x19, x22             // x23 = &state[col*4]

    // a0..a3
    ldrb w4, [x23, #0]             // a0
    ldrb w5, [x23, #1]             // a1
    ldrb w6, [x23, #2]             // a2
    ldrb w7, [x23, #3]             // a3

    // ---- Precalcular t2_i y t3_i ----

    // t2_0
    and  w16, w4, #0x80
    lsl  w8,  w4, #1
    and  w8,  w8, #0xFF
    cbz  w16, 1f
    mov  w17, #0x1B
    eor  w8,  w8, w17
1:
    eor  w12, w8,  w4             // t3_0

    // t2_1
    and  w16, w5, #0x80
    lsl  w9,  w5, #1
    and  w9,  w9, #0xFF
    cbz  w16, 2f
    mov  w17, #0x1B
    eor  w9,  w9, w17
2:
    eor  w13, w9,  w5             // t3_1

    // t2_2
    and  w16, w6, #0x80
    lsl  w10, w6, #1
    and  w10, w10, #0xFF
    cbz  w16, 3f
    mov  w17, #0x1B
    eor  w10, w10, w17
3:
    eor  w14, w10, w6             // t3_2

    // t2_3
    and  w16, w7, #0x80
    lsl  w11, w7, #1
    and  w11, w11, #0xFF
    cbz  w16, 4f
    mov  w17, #0x1B
    eor  w11, w11, w17
4:
    eor  w15, w11, w7             // t3_3

    // ---- fila r = 0 (MixColMat[0..3]) ----
    ldrb w0, [x20, #0]            // c0
    ldrb w1, [x20, #1]            // c1
    ldrb w2, [x20, #2]            // c2
    ldrb w3, [x20, #3]            // c3

    // sel(c0, a0)
    cmp  w0, #1
    b.eq  10f
    cmp  w0, #2
    b.eq  11f
    mov  w18, w12                 // 3*a0
    b     12f
10: mov  w18, w4                  // 1*a0
    b     12f
11: mov  w18, w8                  // 2*a0
12:
    // sel(c1, a1)
    cmp  w1, #1
    b.eq  13f
    cmp  w1, #2
    b.eq  14f
    eor  w18, w18, w13            // ^(3*a1)
    b     15f
13: eor  w18, w18, w5             // ^(1*a1)
    b     15f
14: eor  w18, w18, w9             // ^(2*a1)
15:
    // sel(c2, a2)
    cmp  w2, #1
    b.eq  16f
    cmp  w2, #2
    b.eq  17f
    eor  w18, w18, w14            // ^(3*a2)
    b     18f
16: eor  w18, w18, w6             // ^(1*a2)
    b     18f
17: eor  w18, w18, w10            // ^(2*a2)
18:
    // sel(c3, a3)
    cmp  w3, #1
    b.eq  19f
    cmp  w3, #2
    b.eq  20f
    eor  w18, w18, w15            // ^(3*a3)
    b     21f
19: eor  w18, w18, w7             // ^(1*a3)
    b     21f
20: eor  w18, w18, w11            // ^(2*a3)
21:
    strb w18, [x23, #0]

    // ---- fila r = 1 (offset +4) ----
    ldrb w0, [x20, #4]
    ldrb w1, [x20, #5]
    ldrb w2, [x20, #6]
    ldrb w3, [x20, #7]

    // repetir selección/acumulación
    cmp  w0, #1 ; b.eq 22f
    cmp  w0, #2 ; b.eq 23f
    mov  w18, w12 ; b 24f
22: mov  w18, w4  ; b 24f
23: mov  w18, w8
24:
    cmp  w1, #1 ; b.eq 25f
    cmp  w1, #2 ; b.eq 26f
    eor  w18, w18, w13 ; b 27f
25: eor  w18, w18, w5  ; b 27f
26: eor  w18, w18, w9
27:
    cmp  w2, #1 ; b.eq 28f
    cmp  w2, #2 ; b.eq 29f
    eor  w18, w18, w14 ; b 30f
28: eor  w18, w18, w6  ; b 30f
29: eor  w18, w18, w10
30:
    cmp  w3, #1 ; b.eq 31f
    cmp  w3, #2 ; b.eq 32f
    eor  w18, w18, w15 ; b 33f
31: eor  w18, w18, w7  ; b 33f
32: eor  w18, w18, w11
33:
    strb w18, [x23, #1]

    // ---- fila r = 2 (offset +8) ----
    ldrb w0, [x20, #8]
    ldrb w1, [x20, #9]
    ldrb w2, [x20, #10]
    ldrb w3, [x20, #11]

    cmp  w0, #1 ; b.eq 34f
    cmp  w0, #2 ; b.eq 35f
    mov  w18, w12 ; b 36f
34: mov  w18, w4  ; b 36f
35: mov  w18, w8
36:
    cmp  w1, #1 ; b.eq 37f
    cmp  w1, #2 ; b.eq 38f
    eor  w18, w18, w13 ; b 39f
37: eor  w18, w18, w5  ; b 39f
38: eor  w18, w18, w9
39:
    cmp  w2, #1 ; b.eq 40f
    cmp  w2, #2 ; b.eq 41f
    eor  w18, w18, w14 ; b 42f
40: eor  w18, w18, w6  ; b 42f
41: eor  w18, w18, w10
42:
    cmp  w3, #1 ; b.eq 43f
    cmp  w3, #2 ; b.eq 44f
    eor  w18, w18, w15 ; b 45f
43: eor  w18, w18, w7  ; b 45f
44: eor  w18, w18, w11
45:
    strb w18, [x23, #2]

    // ---- fila r = 3 (offset +12) ----
    ldrb w0, [x20, #12]
    ldrb w1, [x20, #13]
    ldrb w2, [x20, #14]
    ldrb w3, [x20, #15]

    cmp  w0, #1 ; b.eq 46f
    cmp  w0, #2 ; b.eq 47f
    mov  w18, w12 ; b 48f
46: mov  w18, w4  ; b 48f
47: mov  w18, w8
48:
    cmp  w1, #1 ; b.eq 49f
    cmp  w1, #2 ; b.eq 50f
    eor  w18, w18, w13 ; b 51f
49: eor  w18, w18, w5  ; b 51f
50: eor  w18, w18, w9
51:
    cmp  w2, #1 ; b.eq 52f
    cmp  w2, #2 ; b.eq 53f
    eor  w18, w18, w14 ; b 54f
52: eor  w18, w18, w6  ; b 54f
53: eor  w18, w18, w10
54:
    cmp  w3, #1 ; b.eq 55f
    cmp  w3, #2 ; b.eq 56f
    eor  w18, w18, w15 ; b 57f
55: eor  w18, w18, w7  ; b 57f
56: eor  w18, w18, w11
57:
    strb w18, [x23, #3]

    // siguiente columna
    add  x21, x21, #1
    b    col_loop

end_mc:
    // Epílogo: restaurar call-saved
    ldp x23, x24, [sp, #48]
    ldp x21, x22, [sp, #32]
    ldp x19, x20, [sp, #16]
    ldp x29, x30, [sp], #64
    ret

    .size mixColumns, (. - mixColumns)
