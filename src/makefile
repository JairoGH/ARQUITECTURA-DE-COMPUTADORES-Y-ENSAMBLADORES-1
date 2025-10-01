TARGET    := main.elf

SRCDIR    := .
FUNDIR    := Fun
LIBDIR    := Libs

SRC := main.s Fun/AddRoundKey.s Fun/ByteSub.s Fun/ShiftRow.s Fun/MixColumns.s Libs/Constants.s Libs/KeyExpansion.s



OBJ       := $(SRC:.s=.o)

UNAME_M   := $(shell uname -m)

ifeq ($(UNAME_M),aarch64)
  TOOLCHAIN ?=
else
  TOOLCHAIN ?= aarch64-linux-gnu-
endif

AS        := $(TOOLCHAIN)as
LD        := $(TOOLCHAIN)ld
OBJDUMP   := $(TOOLCHAIN)objdump
OBJCOPY   := $(TOOLCHAIN)objcopy

ASFLAGS   := -g
LDFLAGS   := -nostdlib -static -e _start

QEMU      := qemu-aarch64
QEMU_L    ?= /usr/aarch64-linux-gnu

.PHONY: all run clean disasm bin run-demo

all: $(TARGET)

$(TARGET): $(OBJ)
	$(LD) $(LDFLAGS) -o $@ $^

%.o: %.s
	$(AS) $(ASFLAGS) -o $@ $<

run: $(TARGET)
ifeq ($(UNAME_M),aarch64)
	./$(TARGET)
else
	$(QEMU) -L $(QEMU_L) ./$(TARGET)
endif

# Útil para probar sin “congelar” por stdin
run-demo: $(TARGET)
ifeq ($(UNAME_M),aarch64)
	printf "hola\nFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF\n" | ./$(TARGET)
else
	printf "hola\nFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF\n" | $(QEMU) -L $(QEMU_L) ./$(TARGET)
endif

disasm: $(TARGET)
	$(OBJDUMP) -d -M reg-names=std --no-show-raw-insn $(TARGET) | less

bin: $(TARGET)
	$(OBJCOPY) -O binary $(TARGET) main.bin
	@echo "Generado main.bin"

clean:
	rm -f $(OBJ) $(TARGET) main.bin
