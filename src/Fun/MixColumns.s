// ======================= MixColumns =======================

    .text
    .global mixColumns
    .global MixColumns
    .type   mixColumns, %function

    .extern matState
    .extern MixColMat

mixColumns:
MixColumns:

    stp x29, x30, [sp, #-64]!
    mov x29, sp
    stp x19, x20, [sp, #16]
    stp x21, x22, [sp, #32]
    stp x23, x24, [sp, #48]

    // x19: base del estado (matState), x20: base de MixColMat
    ldr x19, =matState
    ldr x20, =MixColMat

    //  Bucle por columna (col = 0..3)
    mov x21, #0

col_loop:
    cmp x21, #4
    b.ge end_mc

    // base de la columna: &state[col*4] en column-major
    lsl  x22, x21, #2              // x22 = col*4
    add  x23, x19, x22             // x23 = &state[col*4]

    // Cargar la columna actual: a0..a3 (filas 0..3)
    ldrb w4, [x23, #0]             // a0
    ldrb w5, [x23, #1]             // a1
    ldrb w6, [x23, #2]             // a2
    ldrb w7, [x23, #3]             // a3

    //  Precalcular en GF(2^8) 
    // t2_0 = 2*a0 ; t3_0 = t2_0 ^ a0
    and  w16, w4, #0x80
    lsl  w8,  w4, #1
    and  w8,  w8, #0xFF
    cbz  w16, 1f
    mov  w17, #0x1B
    eor  w8,  w8, w17
1:
    eor  w12, w8,  w4             // t3_0

    // t2_1 = 2*a1 ; t3_1 = t2_1 ^ a1
    and  w16, w5, #0x80
    lsl  w9,  w5, #1
    and  w9,  w9, #0xFF
    cbz  w16, 2f
    mov  w17, #0x1B
    eor  w9,  w9, w17
2:
    eor  w13, w9,  w5             // t3_1

    // t2_2 = 2*a2 ; t3_2 = t2_2 ^ a2
    and  w16, w6, #0x80
    lsl  w10, w6, #1
    and  w10, w10, #0xFF
    cbz  w16, 3f
    mov  w17, #0x1B
    eor  w10, w10, w17
3:
    eor  w14, w10, w6             // t3_2

    // t2_3 = 2*a3 ; t3_3 = t2_3 ^ a3
    and  w16, w7, #0x80
    lsl  w11, w7, #1
    and  w11, w11, #0xFF
    cbz  w16, 4f
    mov  w17, #0x1B
    eor  w11, w11, w17
4:
    eor  w15, w11, w7             // t3_3

    // Fila r = 0: coeficientes MixColMat[0..3] = [2,3,1,1]
    // Construye b0 = 2*a0 ^ 3*a1 ^ 1*a2 ^ 1*a3
    ldrb w0, [x20, #0]            // c0
    ldrb w1, [x20, #1]            // c1
    ldrb w2, [x20, #2]            // c2
    ldrb w3, [x20, #3]            // c3

    // Selecciones/Acumulaciones según c0..c3 ∈ {1,2,3}
    // Se aprovechan t2_i (2*ai) y t3_i (3*ai)
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
    strb w18, [x23, #0]           // b0 → fila 0

    // Fila r = 1: coeficientes = [1,2,3,1]
    // b1 = 1*a0 ^ 2*a1 ^ 3*a2 ^ 1*a3
    ldrb w0, [x20, #4]
    ldrb w1, [x20, #5]
    ldrb w2, [x20, #6]
    ldrb w3, [x20, #7]

    cmp  w0, #1 ; b.eq 22f
    cmp  w0, #2 ; b.eq 23f
    mov  w18, w12 ; b 24f         // 3*a0
22: mov  w18, w4  ; b 24f         // 1*a0
23: mov  w18, w8                  // 2*a0
24:
    cmp  w1, #1 ; b.eq 25f
    cmp  w1, #2 ; b.eq 26f
    eor  w18, w18, w13 ; b 27f    // ^(3*a1)
25: eor  w18, w18, w5  ; b 27f    // ^(1*a1)
26: eor  w18, w18, w9             // ^(2*a1)
27:
    cmp  w2, #1 ; b.eq 28f
    cmp  w2, #2 ; b.eq 29f
    eor  w18, w18, w14 ; b 30f    // ^(3*a2)
28: eor  w18, w18, w6  ; b 30f    // ^(1*a2)
29: eor  w18, w18, w10            // ^(2*a2)
30:
    cmp  w3, #1 ; b.eq 31f
    cmp  w3, #2 ; b.eq 32f
    eor  w18, w18, w15 ; b 33f    // ^(3*a3)
31: eor  w18, w18, w7  ; b 33f    // ^(1*a3)
32: eor  w18, w18, w11            // ^(2*a3)
33:
    strb w18, [x23, #1]           // b1 → fila 1

    // Fila r = 2: coeficientes = [1,1,2,3]
    // b2 = 1*a0 ^ 1*a1 ^ 2*a2 ^ 3*a3
    ldrb w0, [x20, #8]
    ldrb w1, [x20, #9]
    ldrb w2, [x20, #10]
    ldrb w3, [x20, #11]

    cmp  w0, #1 ; b.eq 34f
    cmp  w0, #2 ; b.eq 35f
    mov  w18, w12 ; b 36f         // 3*a0
34: mov  w18, w4  ; b 36f         // 1*a0
35: mov  w18, w8                  // 2*a0
36:
    cmp  w1, #1 ; b.eq 37f
    cmp  w1, #2 ; b.eq 38f
    eor  w18, w18, w13 ; b 39f    // ^(3*a1)
37: eor  w18, w18, w5  ; b 39f    // ^(1*a1)
38: eor  w18, w18, w9             // ^(2*a1)
39:
    cmp  w2, #1 ; b.eq 40f
    cmp  w2, #2 ; b.eq 41f
    eor  w18, w18, w14 ; b 42f    // ^(3*a2)
40: eor  w18, w18, w6  ; b 42f    // ^(1*a2)
41: eor  w18, w18, w10            // ^(2*a2)
42:
    cmp  w3, #1 ; b.eq 43f
    cmp  w3, #2 ; b.eq 44f
    eor  w18, w18, w15 ; b 45f    // ^(3*a3)
43: eor  w18, w18, w7  ; b 45f    // ^(1*a3)
44: eor  w18, w18, w11            // ^(2*a3)
45:
    strb w18, [x23, #2]           // b2 → fila 2

    // Fila r = 3: coeficientes = [3,1,1,2]
    // b3 = 3*a0 ^ 1*a1 ^ 1*a2 ^ 2*a3
    ldrb w0, [x20, #12]
    ldrb w1, [x20, #13]
    ldrb w2, [x20, #14]
    ldrb w3, [x20, #15]

    cmp  w0, #1 ; b.eq 46f
    cmp  w0, #2 ; b.eq 47f
    mov  w18, w12 ; b 48f         // 3*a0
46: mov  w18, w4  ; b 48f         // 1*a0
47: mov  w18, w8                  // 2*a0
48:
    cmp  w1, #1 ; b.eq 49f
    cmp  w1, #2 ; b.eq 50f
    eor  w18, w18, w13 ; b 51f    // ^(3*a1)
49: eor  w18, w18, w5  ; b 51f    // ^(1*a1)
50: eor  w18, w18, w9             // ^(2*a1)
51:
    cmp  w2, #1 ; b.eq 52f
    cmp  w2, #2 ; b.eq 53f
    eor  w18, w18, w14 ; b 54f    // ^(3*a2)
52: eor  w18, w18, w6  ; b 54f    // ^(1*a2)
53: eor  w18, w18, w10            // ^(2*a2)
54:
    cmp  w3, #1 ; b.eq 55f
    cmp  w3, #2 ; b.eq 56f
    eor  w18, w18, w15 ; b 57f    // ^(3*a3)
55: eor  w18, w18, w7  ; b 57f    // ^(1*a3)
56: eor  w18, w18, w11            // ^(2*a3)
57:
    strb w18, [x23, #3]           // b3 → fila 3

    // Siguiente columna
    add  x21, x21, #1
    b    col_loop

end_mc:
    // restaurar call-saved
    ldp x23, x24, [sp, #48]
    ldp x21, x22, [sp, #32]
    ldp x19, x20, [sp, #16]
    ldp x29, x30, [sp], #64
    ret

    .size mixColumns, (. - mixColumns)
