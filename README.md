# 🔐 Arquitectura de Computadores y Ensambladores 1 – AES-128 en ARM64  

Este proyecto implementa el **algoritmo de Encriptación Simétrica AES-128** en el lenguaje ensamblador **ARM64**.  
El objetivo es comprender y demostrar el funcionamiento del algoritmo a bajo nivel, manipulando memoria y registros, y generando un programa capaz de cifrar bloques de **128 bits (16 bytes)** de forma correcta y eficiente.  

---

## 🛠 Tecnologías utilizadas
- **Lenguaje principal:** Ensamblador ARM64  
- **Herramientas de emulación:** QEMU (`qemu-aarch64`)  
- **Depuración:** `gdb-multiarch` / `lldb`  
- **Control de versiones:** GitHub  

---

## ⚙️ Funcionamiento General
1. El usuario ingresa un **texto en claro** (máx. 16 caracteres → 128 bits).  
2. El usuario ingresa una **clave en hexadecimal** (máx. 32 dígitos hex → 128 bits).  
3. El programa construye la **matriz de estado** y la **matriz de clave inicial** en formato **column-major**.  
4. Se realiza la **expansión de clave (KeyExpansion)** para obtener 11 subclaves (0 a 10).  
5. Se ejecutan **10 rondas** del algoritmo AES-128:  
   - Paso 0: `AddRoundKey` inicial.  
   - Rondas 1–9: `SubBytes` → `ShiftRows` → `MixColumns` → `AddRoundKey`.  
   - Ronda 10: `SubBytes` → `ShiftRows` → `AddRoundKey`.  
6. Se muestra en consola la evolución de las matrices y el **resultado final cifrado** en:  
   - **Hexadecimal**  
   - **Texto ASCII**  
7. Se mide el **Tiempo de ejecución** en nanosegundos usando `syscall`.  

---

## 📌 Funciones principales

- **KeyExpansion** – Genera las 11 subclaves de 128 bits a partir de la clave inicial.  
- **AddRoundKey** – XOR entre la matriz de estado y la subclave.  
- **SubBytes** – Sustitución no lineal con la tabla **S-Box**.  
- **ShiftRows** – Rotación de filas en la matriz de estado.  
- **MixColumns** – Mezcla lineal de columnas en el campo de Galois GF(2^8).  

---

## 📂 Estructura del Proyecto

📄 main.s # Programa principal (flujo AES + I/O)

📁 Fun/
│ ├── 📄 AddRoundKey.s # XOR estado con subclave
│ ├── 📄 ByteSub.s # Sustitución S-Box
│ ├── 📄 ShiftRow.s # Rotación de filas
│ ├── 📄 MixColumns.s # Mezcla de columnas
│ ├── 📄 Menu.s # Menú del Proyecto

📁 Libs/
│ ├── 📄 Constants.s # Tablas S-Box, Rcon, MixColumn Matrix
│ ├── 📄 KeyExpansion.s # Generación de subclaves

📁 Obj/
│ 📁 Fun/
│ │ ├── 🧩 AddRound.o
│ │ ├── 🧩 ByteSub.o
│ │ ├── 🧩 Menu.o
│ │ ├── 🧩 MixColumns.o
│ │ ├── 🧩 ShiftRow.o
│ 📁 Libs/
│ │ ├── 🧩 Constants.o
│ │ ├── 🧩 KeyExpansion.o

📁 Test/
│ ├── 📄 aes128.js # Programa Test en JS

---

## 🚀 Compilación y Ejecución

### 1. Compilar el proyecto
```bash
make
```
### 2. Ejecutar en QEMU
```bash
make run
```
### 3. Limpiar
```bash
make clean
```

## 🖥️ Ejemplo de Ejecución

```
========= MENU =========
1) Iniciar Encriptado
 2) Informacion del Estudiante
 3) Salir
 Opcion: 1
Ingrese el texto a cifrar (Maximo 16 caracteres): si sale arqui 1
Matriz de Estado:
73 61 61 69 
69 6C 72 20 
20 65 71 31 
73 20 75 00 

Ingrese la clave (Maximo 32 Hexadecimales): 000102030405060708090A0B0C0D0E0F
Matriz de Clave:
00 04 08 0C 
01 05 09 0D 
02 06 0A 0E 
03 07 0B 0F 

Paso 0: AddRoundKey inicial:
Matriz de Estado:
73 65 69 65 
68 69 7B 2D 
22 63 7B 3F 
70 27 7E 0F 

 ========== RONDA 1 ========== 
 ========== Paso 1: SubBytes ========== 
Matriz de Estado:
8F 4D F9 4D 
45 F9 21 D8 
93 FB 21 75 
51 CC F3 76 

 ========== Paso 2: ShiftRows ========== 
Matriz de Estado:
8F 4D F9 4D 
F9 21 D8 45 
21 75 93 FB 
76 51 CC F3 

 ========== Paso 3: MixColumns ========== 
Matriz de Estado:
42 DD C5 5D 
73 C1 30 22 
AE 75 53 EB 
BE 21 D8 94 

 ========== Subclave de la ronda: ========== 
D6 D2 DA D6 
AA AF A6 AB 
74 72 78 76 
FD FA F1 FE 

 ========== Paso 4: AddRoundKey ========== 
Matriz de Estado:
94 0F 1F 8B 
D9 6E 96 89 
DA 07 2B 9D 
43 DB 29 6A 

 ========== RONDA 2 ========== 
 ========== Paso 1: SubBytes ========== 
Matriz de Estado:
22 76 C0 3D 
35 9F 90 A7 
57 C5 F1 5E 
1A B9 A5 02 

 ========== Paso 2: ShiftRows ========== 
Matriz de Estado:
22 76 C0 3D 
9F 90 A7 35 
F1 5E 57 C5 
02 1A B9 A5 

 ========== Paso 3: MixColumns ========== 
Matriz de Estado:
0D 03 87 45 
0D B5 D5 A6 
42 74 19 6D 
0C 60 C2 E6 

 ========== Subclave de la ronda: ========== 
B6 64 BE 68 
92 3D 9B 30 
CF BD C5 B3 
0B F1 00 FE 

 ========== Paso 4: AddRoundKey ========== 
Matriz de Estado:
BB 67 39 2D 
9F 88 4E 96 
8D C9 DC DE 
07 91 C2 18 

 ========== RONDA 3 ========== 
 ========== Paso 1: SubBytes ========== 
Matriz de Estado:
EA 85 12 D8 
DB C4 2F 90 
5D DD 86 1D 
C5 81 25 AD 

 ========== Paso 2: ShiftRows ========== 
Matriz de Estado:
EA 85 12 D8 
C4 2F 90 DB 
86 1D 5D DD 
AD C5 81 25 

 ========== Paso 3: MixColumns ========== 
Matriz de Estado:
B3 B8 53 25 
45 39 4F 2C 
D5 C4 A0 CD 
26 37 E2 3F 

 ========== Subclave de la ronda: ========== 
B6 D2 6C 04 
FF C2 59 69 
74 C9 0C BF 
4E BF BF 41 

 ========== Paso 4: AddRoundKey ========== 
Matriz de Estado:
05 6A 3F 21 
BA FB 16 45 
A1 0D AC 72 
68 88 5D 7E 

 ========== RONDA 4 ========== 
 ========== Paso 1: SubBytes ========== 
Matriz de Estado:
6B 02 75 FD 
F4 0F 47 6E 
32 D7 91 40 
45 C4 4C F3 

 ========== Paso 2: ShiftRows ========== 
Matriz de Estado:
6B 02 75 FD 
0F 47 6E F4 
91 40 32 D7 
F3 45 C4 4C 

 ========== Paso 3: MixColumns ========== 
Matriz de Estado:
A5 C8 AE 7D 
2E 09 3B 20 
53 0A 28 68 
DE 8B 50 A7 

 ========== Subclave de la ronda: ========== 
47 95 F9 FD 
F7 35 6C 05 
F7 3E 32 8D 
BC 03 BC FD 

 ========== Paso 4: AddRoundKey ========== 
Matriz de Estado:
E2 5D 57 80 
D9 3C 57 25 
A4 34 1A E5 
62 88 EC 5A 

 ========== RONDA 5 ========== 
 ========== Paso 1: SubBytes ========== 
Matriz de Estado:
98 4C 5B CD 
35 EB 5B 3F 
49 18 A2 D9 
AA C4 CE BE 

 ========== Paso 2: ShiftRows ========== 
Matriz de Estado:
98 4C 5B CD 
EB 5B 3F 35 
A2 D9 49 18 
BE AA C4 CE 

 ========== Paso 3: MixColumns ========== 
Matriz de Estado:
11 06 7A 08 
16 20 3A 41 
F5 5B A1 81 
9D 19 08 E6 

 ========== Subclave de la ronda: ========== 
3C A9 50 AD 
AA 9F F3 F6 
A3 9D AF 22 
E8 EB 57 AA 

 ========== Paso 4: AddRoundKey ========== 
Matriz de Estado:
2D AF 2A A5 
BC BF C9 B7 
56 C6 0E A3 
75 F2 5F 4C 

 ========== RONDA 6 ========== 
 ========== Paso 1: SubBytes ========== 
Matriz de Estado:
D8 79 E5 06 
65 08 DD A9 
B1 B4 AB 0A 
9D 89 CF 29 

 ========== Paso 2: ShiftRows ========== 
Matriz de Estado:
D8 79 E5 06 
08 DD A9 65 
AB 0A B1 B4 
29 9D 89 CF 

 ========== Paso 3: MixColumns ========== 
Matriz de Estado:
31 19 09 D8 
07 5B ED C4 
E6 0C B5 5A 
82 7D 25 5E 

 ========== Subclave de la ronda: ========== 
5E F7 A7 0A 
39 A6 55 A3 
0F 92 3D 1F 
7D 96 C1 6B 

 ========== Paso 4: AddRoundKey ========== 
Matriz de Estado:
6F EE AE D2 
3E FD B8 67 
E9 9E 88 45 
FF EB E4 35 

 ========== RONDA 7 ========== 
 ========== Paso 1: SubBytes ========== 
Matriz de Estado:
A8 28 E4 B5 
B2 54 6C 85 
1E 0B C4 6E 
16 E9 69 96 

 ========== Paso 2: ShiftRows ========== 
Matriz de Estado:
A8 28 E4 B5 
54 6C 85 B2 
C4 6E 1E 0B 
96 16 E9 69 

 ========== Paso 3: MixColumns ========== 
Matriz de Estado:
E5 9C B0 DE 
C1 54 3E BE 
CE A2 7D AA 
44 56 65 AF 

 ========== Subclave de la ronda: ========== 
14 E3 44 4E 
F9 5F 0A A9 
70 E2 DF C0 
1A 8C 4D 26 

 ========== Paso 4: AddRoundKey ========== 
Matriz de Estado:
F1 7F F4 90 
38 0B 34 17 
BE 40 A2 6A 
5E DA 28 89 

 ========== RONDA 8 ========== 
 ========== Paso 1: SubBytes ========== 
Matriz de Estado:
A1 D2 BF 60 
07 2B 18 F0 
AE 09 3A 02 
58 57 34 A7 

 ========== Paso 2: ShiftRows ========== 
Matriz de Estado:
A1 D2 BF 60 
2B 18 F0 07 
3A 02 AE 09 
A7 58 57 34 

 ========== Paso 3: MixColumns ========== 
Matriz de Estado:
B9 CD 97 F4 
1E BC FA 41 
0C 26 F1 29 
BC C7 2A C6 

 ========== Subclave de la ronda: ========== 
47 A4 E0 AE 
43 1C 16 BF 
87 65 BA 7A 
35 B9 F4 D2 

 ========== Paso 4: AddRoundKey ========== 
Matriz de Estado:
FE 69 77 5A 
5D A0 EC FE 
8B 43 4B 53 
89 7E DE 14 

 ========== RONDA 9 ========== 
 ========== Paso 1: SubBytes ========== 
Matriz de Estado:
BB F9 F5 BE 
4C E0 CE BB 
3D 1A B3 ED 
A7 F3 1D FA 

 ========== Paso 2: ShiftRows ========== 
Matriz de Estado:
BB F9 F5 BE 
E0 CE BB 4C 
B3 ED 3D 1A 
FA A7 F3 1D 

 ========== Paso 3: MixColumns ========== 
Matriz de Estado:
1F EA E9 B4 
54 F5 2C 15 
33 04 3A E1 
6A 66 7F B5 

 ========== Subclave de la ronda: ========== 
54 F0 10 BE 
99 85 93 2C 
32 57 ED 97 
D1 68 9C 4E 

 ========== Paso 4: AddRoundKey ========== 
Matriz de Estado:
4B 1A F9 0A 
CD 70 BF 39 
01 53 D7 76 
BB 0E E3 FB 

 ========== RONDA 10 ========== 
 ========== Paso 1: SubBytes ========== 
Matriz de Estado:
B3 A2 99 67 
BD 51 08 12 
7C ED 0E 38 
EA AB 11 0F 

 ========== Paso 2: ShiftRows ========== 
Matriz de Estado:
B3 A2 99 67 
51 08 12 BD 
0E 38 7C ED 
0F EA AB 11 

 ========== Subclave de la ronda: ========== 
13 E3 F3 4D 
11 94 07 2B 
1D 4A A7 30 
7F 17 8B C5 

 ========== Paso 4: AddRoundKey ========== 
Matriz de Estado:
A0 41 6A 2A 
40 9C 15 96 
13 72 DB DD 
70 FD 20 D4 

 ========== RESULTADO FINAL DEL CIFRADO  ========== 
A0 41 6A 2A 
40 9C 15 96 
13 72 DB DD 
70 FD 20 D4 

 ========== TEXTO RESULTANTE ========== 
�@pA�r�j� *���
Tiempo de ejecucion: 4 segundos, 737248221 nanosegundos
^Cmake: *** [makefile:56: run] Interrupción

jairogo@Jairo-ThinkPad:~/Documentos/GitHub/ACYE1-P2-2S-201902672/src$ make run
qemu-aarch64 -L /usr/aarch64-linux-gnu ./main.elf

========= MENU =========
1) Iniciar Encriptado
 2) Informacion del Estudiante
 3) Salir
 Opcion: 1
Ingrese el texto a cifrar (Maximo 16 caracteres): si sale arqui 1
Matriz de Estado:
73 61 61 69 
69 6C 72 20 
20 65 71 31 
73 20 75 00 

Ingrese la clave (Maximo 32 Hexadecimales): 000102030405060708090A0B0C0D0E0F
Matriz de Clave:
00 04 08 0C 
01 05 09 0D 
02 06 0A 0E 
03 07 0B 0F 

Paso 0: AddRoundKey inicial:
Matriz de Estado:
73 65 69 65 
68 69 7B 2D 
22 63 7B 3F 
70 27 7E 0F 

 ========== RONDA 1 ========== 
 ========== Paso 1: SubBytes ========== 
Matriz de Estado:
8F 4D F9 4D 
45 F9 21 D8 
93 FB 21 75 
51 CC F3 76 

 ========== Paso 2: ShiftRows ========== 
Matriz de Estado:
8F 4D F9 4D 
F9 21 D8 45 
21 75 93 FB 
76 51 CC F3 

 ========== Paso 3: MixColumns ========== 
Matriz de Estado:
42 DD C5 5D 
73 C1 30 22 
AE 75 53 EB 
BE 21 D8 94 

 ========== Subclave de la ronda: ========== 
D6 D2 DA D6 
AA AF A6 AB 
74 72 78 76 
FD FA F1 FE 

 ========== Paso 4: AddRoundKey ========== 
Matriz de Estado:
94 0F 1F 8B 
D9 6E 96 89 
DA 07 2B 9D 
43 DB 29 6A 

 ========== RONDA 2 ========== 
 ========== Paso 1: SubBytes ========== 
Matriz de Estado:
22 76 C0 3D 
35 9F 90 A7 
57 C5 F1 5E 
1A B9 A5 02 

 ========== Paso 2: ShiftRows ========== 
Matriz de Estado:
22 76 C0 3D 
9F 90 A7 35 
F1 5E 57 C5 
02 1A B9 A5 

 ========== Paso 3: MixColumns ========== 
Matriz de Estado:
0D 03 87 45 
0D B5 D5 A6 
42 74 19 6D 
0C 60 C2 E6 

 ========== Subclave de la ronda: ========== 
B6 64 BE 68 
92 3D 9B 30 
CF BD C5 B3 
0B F1 00 FE 

 ========== Paso 4: AddRoundKey ========== 
Matriz de Estado:
BB 67 39 2D 
9F 88 4E 96 
8D C9 DC DE 
07 91 C2 18 

 ========== RONDA 3 ========== 
 ========== Paso 1: SubBytes ========== 
Matriz de Estado:
EA 85 12 D8 
DB C4 2F 90 
5D DD 86 1D 
C5 81 25 AD 

 ========== Paso 2: ShiftRows ========== 
Matriz de Estado:
EA 85 12 D8 
C4 2F 90 DB 
86 1D 5D DD 
AD C5 81 25 

 ========== Paso 3: MixColumns ========== 
Matriz de Estado:
B3 B8 53 25 
45 39 4F 2C 
D5 C4 A0 CD 
26 37 E2 3F 

 ========== Subclave de la ronda: ========== 
B6 D2 6C 04 
FF C2 59 69 
74 C9 0C BF 
4E BF BF 41 

 ========== Paso 4: AddRoundKey ========== 
Matriz de Estado:
05 6A 3F 21 
BA FB 16 45 
A1 0D AC 72 
68 88 5D 7E 

 ========== RONDA 4 ========== 
 ========== Paso 1: SubBytes ========== 
Matriz de Estado:
6B 02 75 FD 
F4 0F 47 6E 
32 D7 91 40 
45 C4 4C F3 

 ========== Paso 2: ShiftRows ========== 
Matriz de Estado:
6B 02 75 FD 
0F 47 6E F4 
91 40 32 D7 
F3 45 C4 4C 

 ========== Paso 3: MixColumns ========== 
Matriz de Estado:
A5 C8 AE 7D 
2E 09 3B 20 
53 0A 28 68 
DE 8B 50 A7 

 ========== Subclave de la ronda: ========== 
47 95 F9 FD 
F7 35 6C 05 
F7 3E 32 8D 
BC 03 BC FD 

 ========== Paso 4: AddRoundKey ========== 
Matriz de Estado:
E2 5D 57 80 
D9 3C 57 25 
A4 34 1A E5 
62 88 EC 5A 

 ========== RONDA 5 ========== 
 ========== Paso 1: SubBytes ========== 
Matriz de Estado:
98 4C 5B CD 
35 EB 5B 3F 
49 18 A2 D9 
AA C4 CE BE 

 ========== Paso 2: ShiftRows ========== 
Matriz de Estado:
98 4C 5B CD 
EB 5B 3F 35 
A2 D9 49 18 
BE AA C4 CE 

 ========== Paso 3: MixColumns ========== 
Matriz de Estado:
11 06 7A 08 
16 20 3A 41 
F5 5B A1 81 
9D 19 08 E6 

 ========== Subclave de la ronda: ========== 
3C A9 50 AD 
AA 9F F3 F6 
A3 9D AF 22 
E8 EB 57 AA 

 ========== Paso 4: AddRoundKey ========== 
Matriz de Estado:
2D AF 2A A5 
BC BF C9 B7 
56 C6 0E A3 
75 F2 5F 4C 

 ========== RONDA 6 ========== 
 ========== Paso 1: SubBytes ========== 
Matriz de Estado:
D8 79 E5 06 
65 08 DD A9 
B1 B4 AB 0A 
9D 89 CF 29 

 ========== Paso 2: ShiftRows ========== 
Matriz de Estado:
D8 79 E5 06 
08 DD A9 65 
AB 0A B1 B4 
29 9D 89 CF 

 ========== Paso 3: MixColumns ========== 
Matriz de Estado:
31 19 09 D8 
07 5B ED C4 
E6 0C B5 5A 
82 7D 25 5E 

 ========== Subclave de la ronda: ========== 
5E F7 A7 0A 
39 A6 55 A3 
0F 92 3D 1F 
7D 96 C1 6B 

 ========== Paso 4: AddRoundKey ========== 
Matriz de Estado:
6F EE AE D2 
3E FD B8 67 
E9 9E 88 45 
FF EB E4 35 

 ========== RONDA 7 ========== 
 ========== Paso 1: SubBytes ========== 
Matriz de Estado:
A8 28 E4 B5 
B2 54 6C 85 
1E 0B C4 6E 
16 E9 69 96 

 ========== Paso 2: ShiftRows ========== 
Matriz de Estado:
A8 28 E4 B5 
54 6C 85 B2 
C4 6E 1E 0B 
96 16 E9 69 

 ========== Paso 3: MixColumns ========== 
Matriz de Estado:
E5 9C B0 DE 
C1 54 3E BE 
CE A2 7D AA 
44 56 65 AF 

 ========== Subclave de la ronda: ========== 
14 E3 44 4E 
F9 5F 0A A9 
70 E2 DF C0 
1A 8C 4D 26 

 ========== Paso 4: AddRoundKey ========== 
Matriz de Estado:
F1 7F F4 90 
38 0B 34 17 
BE 40 A2 6A 
5E DA 28 89 

 ========== RONDA 8 ========== 
 ========== Paso 1: SubBytes ========== 
Matriz de Estado:
A1 D2 BF 60 
07 2B 18 F0 
AE 09 3A 02 
58 57 34 A7 

 ========== Paso 2: ShiftRows ========== 
Matriz de Estado:
A1 D2 BF 60 
2B 18 F0 07 
3A 02 AE 09 
A7 58 57 34 

 ========== Paso 3: MixColumns ========== 
Matriz de Estado:
B9 CD 97 F4 
1E BC FA 41 
0C 26 F1 29 
BC C7 2A C6 

 ========== Subclave de la ronda: ========== 
47 A4 E0 AE 
43 1C 16 BF 
87 65 BA 7A 
35 B9 F4 D2 

 ========== Paso 4: AddRoundKey ========== 
Matriz de Estado:
FE 69 77 5A 
5D A0 EC FE 
8B 43 4B 53 
89 7E DE 14 

 ========== RONDA 9 ========== 
 ========== Paso 1: SubBytes ========== 
Matriz de Estado:
BB F9 F5 BE 
4C E0 CE BB 
3D 1A B3 ED 
A7 F3 1D FA 

 ========== Paso 2: ShiftRows ========== 
Matriz de Estado:
BB F9 F5 BE 
E0 CE BB 4C 
B3 ED 3D 1A 
FA A7 F3 1D 

 ========== Paso 3: MixColumns ========== 
Matriz de Estado:
1F EA E9 B4 
54 F5 2C 15 
33 04 3A E1 
6A 66 7F B5 

 ========== Subclave de la ronda: ========== 
54 F0 10 BE 
99 85 93 2C 
32 57 ED 97 
D1 68 9C 4E 

 ========== Paso 4: AddRoundKey ========== 
Matriz de Estado:
4B 1A F9 0A 
CD 70 BF 39 
01 53 D7 76 
BB 0E E3 FB 

 ========== RONDA 10 ========== 
 ========== Paso 1: SubBytes ========== 
Matriz de Estado:
B3 A2 99 67 
BD 51 08 12 
7C ED 0E 38 
EA AB 11 0F 

 ========== Paso 2: ShiftRows ========== 
Matriz de Estado:
B3 A2 99 67 
51 08 12 BD 
0E 38 7C ED 
0F EA AB 11 

 ========== Subclave de la ronda: ========== 
13 E3 F3 4D 
11 94 07 2B 
1D 4A A7 30 
7F 17 8B C5 

 ========== Paso 4: AddRoundKey ========== 
Matriz de Estado:
A0 41 6A 2A 
40 9C 15 96 
13 72 DB DD 
70 FD 20 D4 

 ========== RESULTADO FINAL DEL CIFRADO  ========== 
A0 41 6A 2A 
40 9C 15 96 
13 72 DB DD 
70 FD 20 D4 

 ========== TEXTO RESULTANTE ========== 
�@pA�r�j� *���
Tiempo de ejecucion: 13 segundos, 591258735 nanosegundos


```
--- 

## ✨ Autor

**Jairo Adelso Gómez Hernández**  
_Carnet: 201902672_  
_Curso: Arquitectura de Computadores y Ensambladores 1 – 2S 2025_

---