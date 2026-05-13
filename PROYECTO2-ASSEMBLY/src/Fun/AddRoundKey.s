// ======================= AddRoundKey =======================


    .text
    .global addRoundKey
    .type   addRoundKey, %function
    .extern matState


// Uso:
//   x0 = &matState
//   x1 = &subclave de 16 bytes dentro de roundKeys
addRoundKey:
    // Se guarda el frame pointer (x29) y el link register (x30)
    stp x29, x30, [sp, #-32]!       
    mov x29, sp                    

    // Se guardan registros temporales x19 y x20 
    stp x19, x20, [sp, #16]

    // Cargar dirección base del estado (matState)
    ldr x19, =matState              // x19 = &matState (puntero al estado)

    // Guardar el puntero de la subclave recibida en x1
    mov x20, x1                     // x20 = &subclave de ronda actual

    mov x0, #0                      // i = 0

// Bucle para procesar los 16 bytes del estado
1:  cmp x0, #16            
    b.ge 2f                         // Si i >= 16 -> fin del bucle

    // Cargar un byte del estado y un byte de la subclave
    ldrb w1, [x19, x0]              // w1 = matState[i]
    ldrb w2, [x20, x0]              // w2 = subclave[i]

    // Operación XOR (bit a bit) entre ambos bytes
    eor  w3, w1, w2                 // w3 = w1 XOR w2

    // Guardar el resultado de vuelta en el estado
    strb w3, [x19, x0]              // matState[i] = w3

    // Incrementar contador i++
    add x0, x0, #1
    b    1b                         // Repetir para el siguiente byte

2:
    // Restaurar los registros temporales y el frame anterior.
    ldp x19, x20, [sp, #16]         // Recuperar x19 y x20
    ldp x29, x30, [sp], #32         
    ret                             
 
    .size addRoundKey, (. - addRoundKey)