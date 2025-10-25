// ======================= ByteSub =======================
    .text
    .global subBytes
    .type   subBytes, %function
    .extern matState      
    .extern Sbox      

// SubBytes: Sustitución de bytes mediante tabla Sbox

subBytes:
    // Guarda los registros base de marco y retorno.
    stp x29, x30, [sp, #-32]!
    mov x29, sp
    // Guarda registros temporales que se usarán dentro de la función.
    stp x19, x20, [sp, #16]

    // Cargar direcciones base 
    ldr x19, =matState     // x19 -> dirección base del estado
    ldr x20, =Sbox         // x20 -> dirección base de la tabla S-box

    // Bucle (procesar los 16 bytes del estado) 
    mov x0, #0             // contador i = 0
1:  cmp x0, #16            // Comparar i con 16
    b.ge 2f                // si i >= 16, terminar

    // Cargar un byte del estado (valor 0..255)
    ldrb w1, [x19, x0]     // w1 = matState[i]
    uxtw x1, w1            // ampliar a 64 bits para indexar (índice Sbox)

    // Consultar la tabla S-box y obtener el valor sustituido
    ldrb w2, [x20, x1]     // w2 = Sbox[ matState[i] ]

    // Guardar el valor transformado en el mismo lugar
    strb w2, [x19, x0]     // matState[i] = nuevo valor

    // Avanzar al siguiente byte
    add x0, x0, #1
    b 1b                   // repetir hasta completar los 16 bytes

2:
    // Restaurar registros preservados y volver al llamador
    ldp x19, x20, [sp, #16]
    ldp x29, x30, [sp], #32
    ret

    .size subBytes, (. - subBytes)