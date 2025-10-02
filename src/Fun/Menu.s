// ======================= Menu =======================

    .section .data
menu_title:     .asciz "\n========= MENU =========\n"
lenMenuTitle = . - menu_title

menu_opts:      .asciz "1) Iniciar Encriptado\n 2) Informacion del Estudiante\n 3) Salir\n Seleccione Una Opcion: "
lenMenuOpts = . - menu_opts

menu_err:       .asciz "Opcion invalida. Intente de nuevo.\n"
lenMenuErr = . - menu_err

newline:        .asciz "\n"

    .section .bss
    .align 4
menu_buf:       .space 8, 0

    .section .text
    .align 2
    .global menu_loop
    .type   menu_loop, %function

    // Externs que vamos a invocar del main.s
    .extern start_encryption
    .extern print_student_info

// --- Helpers locales para syscalls ---
.macro MENU_PRINT ptr, len
    mov x0, #1          // fd = stdout
    ldr x1, =\ptr
    mov x2, \len
    mov x8, #64         // write
    svc #0
.endm

.macro MENU_READ ptr, maxlen
    mov x0, #0
    ldr x1, =\ptr
    mov x2, \maxlen
    mov x8, #63         // read
    svc #0
.endm

menu_loop:
    // Menú infinito hasta que elija '3'
1:
    // Pintar cabecera y opciones
    MENU_PRINT menu_title, lenMenuTitle
    MENU_PRINT menu_opts,  lenMenuOpts

    // Leer 1 línea (tomamos el primer carácter significativo)
    MENU_READ menu_buf, 8

    // Cargar primer byte
    ldr x9, =menu_buf
    ldrb w10, [x9]

    // Si el primer byte es '\n', intenta leer de nuevo
    cmp w10, #'\n'
    beq 1b

    // Despacho por opción
    cmp w10, #'1'
    beq do_encrypt
    cmp w10, #'2'
    beq do_info
    cmp w10, #'3'
    beq do_exit

    // Opción inválida
    MENU_PRINT menu_err, lenMenuErr
    b 1b

do_encrypt:
    bl  start_encryption      // vuelve aquí al terminar
    b   1b

do_info:
    bl  print_student_info    // vuelve al menú
    b   1b

do_exit:
    // Exit(0)
    mov x0, #0
    mov x8, #93
    svc #0

    ret
    .size menu_loop, (. - menu_loop)
