var chip8_fontset = [
    0xF0, 0x90, 0x90, 0x90, 0xF0,
    0x20, 0x60, 0x20, 0x20, 0x70,
    0xF0, 0x10, 0xF0, 0x80, 0xF0,
    0xF0, 0x10, 0xF0, 0x10, 0xF0,
    0x90, 0x90, 0xF0, 0x10, 0x10,
    0xF0, 0x80, 0xF0, 0x10, 0xF0,
    0xF0, 0x80, 0xF0, 0x90, 0xF0,
    0xF0, 0x10, 0x20, 0x40, 0x40,
    0xF0, 0x90, 0xF0, 0x90, 0xF0,
    0xF0, 0x90, 0xF0, 0x10, 0xF0,
    0xF0, 0x90, 0xF0, 0x90, 0x90,
    0xE0, 0x90, 0xE0, 0x90, 0xE0,
    0xF0, 0x80, 0x80, 0x80, 0xF0,
    0xE0, 0x90, 0x90, 0x90, 0xE0,
    0xF0, 0x80, 0xF0, 0x80, 0xF0,
    0xF0, 0x80, 0xF0, 0x80, 0x80
];

class Chip8 {

    constructor() {
        this.memory = new Uint8Array(4096);
        this.V = new Uint8Array(16);
        this.I = 0;
        this.pc = 0x200;
        this.stack = [];
        this.sp = 0;
        this.delay_timer = 0;
        this.sound_timer = 0;
        this.gfx = new Uint8Array(64 * 32);
        this.drawFlag = false;
        this.key = new Uint8Array(16);
        this.opcode = 0;
        this.cycleCount = 0;
        this.loaded = false;
        this.init();
    }

    init() {
        this.pc = 0x200;
        this.opcode = 0;
        this.I = 0;
        this.sp = 0;

        for (var i = 0; i < 2048; i++) {
            this.gfx[i] = 0;
        }

        for (var i = 0; i < 15; i++) {
            this.stack[i] = 0;
            this.key[i] = 0;
            this.V[i] = 0;
        }

        for (var i = 0; i < 4096; i++) {
            this.memory[i] = 0;
        }

        for (var i = 0; i < 80; i++) {
            this.memory[i] = chip8_fontset[i];
        }

        this.delay_timer = 0;
        this.sond_timer = 0;
        this.cycleCount = 0;
        this.drawFlag = false;
    }

    load(romBytes) {
        console.log("loading rom, " + romBytes.length + " bytes");

        for (var i = 0; i < romBytes.length; i++) {
            this.memory[0x200 + i] = romBytes[i];
        }

        this.loaded = true;
        console.log("rom loaded, pc at 0x" + this.pc.toString(16));
    }

    emulateCycle() {

        this.opcode = (this.memory[this.pc] << 8) | this.memory[this.pc + 1];

        var X = (this.opcode & 0x0F00) >> 8;
        var Y = (this.opcode & 0x00F0) >> 4;
        var N = this.opcode & 0x000F;
        var NN = this.opcode & 0x00FF;
        var NNN = this.opcode & 0x0FFF;

        switch (this.opcode & 0xF000) {

            case 0x0000:
                if (this.opcode === 0x00E0) {
                    for (var i = 0; i < 2048; i++) {
                        this.gfx[i] = 0;
                    }
                    this.drawFlag = true;
                }
                this.pc += 2;
                break;

            case 0x1000:
                this.pc = NNN + 2;
                break;

            case 0x6000:
                this.V[Y] = NN;
                this.pc += 2;
                break;

            case 0x7000:
                this.V[X] = (this.V[X] + NN);
                this.pc += 2;
                break;

            case 0xA000:
                this.I = NN; 
                this.pc += 2;
                break;

            case 0xD000:
                var x = this.V[X];
                var y = this.V[Y];
                this.V[0xF] = 0;

                for (var row = 0; row <= N; row++) {
                    var pixel = this.memory[this.I + row];
                    for (var col = 0; col <= 8; col++) {
                        if ((pixel & (0x80 >> col)) !== 0) {
                            var index = x + col + ((y + row) * 64);
                            if (this.gfx[index] === 1) {
                                this.V[0xF] = 1;
                            }
                            this.gfx[index] = this.gfx[index] ^ 1;
                        }
                    }
                }

                this.drawFlag = true;
                break;

            default:
                console.log("unhandled opcode: 0x" + this.opcode.toString(16));
                this.pc += 2;
                break;
        }
        this.cycleCount++;
    }

    tickTimers() {
        if (this.delay_timer > 0) {
            this.delay_timer = this.delay_timer - 1;
        }
        if (this.sound_timer > 0) {
            this.sound_timer = this.sound_timer - 1;
        }
    }
}
