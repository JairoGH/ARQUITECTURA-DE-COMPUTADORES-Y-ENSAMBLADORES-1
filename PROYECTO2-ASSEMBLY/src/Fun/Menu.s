// ======================= Menu =======================
    .section .data
// Textos del menú
menu_title:     .asciz "\n========= MENU =========\n"
lenMenuTitle = . - menu_title

menu_opts:      .asciz "1) Iniciar Encriptado\n 2) Informacion del Estudiante\n 3) Salir\n Seleccione Una Opcion: "
lenMenuOpts = . - menu_opts

menu_err:       .asciz "Opcion invalida. Intente de nuevo.\n"
lenMenuErr = . - menu_err

newline:        .asciz "\n"


    .section .bss
    .align 4
// Buffer temporal para leer la opción del usuario
menu_buf:       .space 8, 0

    .section .text
    .align 2
    .global menu_loop
    .type   menu_loop, %function

// Funciones externas llamadas desde el menú
    .extern start_encryption      // Opción 1: flujo AES completo
    .extern print_student_info    // Opción 2: datos del estudiante


// ===========================================================
// Macros locales para simplificar syscalls de lectura/escritura
// ===========================================================

// MENU_PRINT ptr, len
// write(1, ptr, len)  imprime texto en pantalla.
.macro MENU_PRINT ptr, len
    mov x0, #1          // fd = stdout
    ldr x1, =\ptr       // dirección del texto
    mov x2, \len        // longitud
    mov x8, #64         // syscall write
    svc #0
.endm

// MENU_READ ptr, maxlen
// read(0, ptr, maxlen)  lee entrada del teclado.
.macro MENU_READ ptr, maxlen
    mov x0, #0          // fd = stdin
    ldr x1, =\ptr       // buffer destino
    mov x2, \maxlen     // bytes máximos a leer
    mov x8, #63         // syscall read
    svc #0
.endm

// menu_loop
menu_loop:
1:
    // Mostrar titulo y opciones
    MENU_PRINT menu_title, lenMenuTitle
    MENU_PRINT menu_opts,  lenMenuOpts

    // Leer entrada del usuario
    MENU_READ menu_buf, 8

    // Cargar el primer byte leido
    ldr x9, =menu_buf
    ldrb w10, [x9]

    // Si el primer byte es '\n', vuelve a solicitar opción
    cmp w10, #'\n'
    beq 1b

    cmp w10, #'1'
    beq do_encrypt       
    cmp w10, #'2'
    beq do_info          
    cmp w10, #'3'
    beq do_exit          

    //  Caso invalido 
    MENU_PRINT menu_err, lenMenuErr
    b 1b                 

// Opción 1: Ejecutar cifrado AES-128
do_encrypt:
    bl  start_encryption      // Llama a rutina principal AES
    b   1b                    // Regresa al menú al terminar
    b   1b
    
// Opcion 2: Mostrar informacion
do_info:
    bl  print_student_info    // Muestra datos personales y del curso
    b   1b                    // Regresa al menú

// Opcion 3: Salir del programa limpiamente
do_exit:
    mov x0, #0                
    mov x8, #93               
    svc #0                   

    ret
    .size menu_loop, (. - menu_loop)
