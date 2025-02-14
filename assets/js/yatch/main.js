class Instruction {
  constructor(ass, instr, original = 0) {
    if (!ass) {
      this.binary = original;
      this.decimal = instr[0];
      this.type = "binary";
      this.opcode = instr[0] & 0x7f; // Last 7 bits for opcode
      this.funct = (instr[0] >>> 7) & 0x3f; // 6 bits before opcode
      this.shamt = (instr[0] >>> 13) & 0x1f; // 5 bits before funct
      this.rd = (instr[0] >>> 18) & 0x1f; // 5 bits before shamt
      this.rt = (instr[0] >>> 23) & 0x1f; // 5 bits before rd
      this.rs = (instr[0] >>> 28) & 0x1f; // 5 bits before rt

      switch (this.opcode) {
        case 0x33: // 0110011 in binary, decimal 51
          // R-type instructions (Register-Register operations)
          this.format = "R";
          this.rd = (instr[0] >>> 7) & 0x1f; // bits [11:7]
          this.funct3 = (instr[0] >>> 12) & 0x7; // bits [14:12]
          this.rs1 = (instr[0] >>> 15) & 0x1f; // bits [19:15]
          this.rs2 = (instr[0] >>> 20) & 0x1f; // bits [24:20]
          this.funct7 = (instr[0] >>> 25) & 0x7f; // bits [31:25]

          switch (this.funct3) {
            case 0x0:
              if (this.funct7 === 0x00) {
                this.instructionType = "ADD";
                this.assembly = `ADD x${this.rd}, x${this.rs1}, x${this.rs2}`;
              } else if (this.funct7 === 0x20) {
                this.instructionType = "SUB";
                this.assembly = `SUB x${this.rd}, x${this.rs1}, x${this.rs2}`;
              } else {
                this.instructionType = "UNKNOWN";
                this.assembly = "UNKNOWN";
              }
              break;
            case 0x1:
              this.instructionType = "SLL";
              this.assembly = `SLL x${this.rd}, x${this.rs1}, x${this.rs2}`;
              break;
            case 0x2:
              this.instructionType = "SLT";
              this.assembly = `SLT x${this.rd}, x${this.rs1}, x${this.rs2}`;
              break;
            case 0x3:
              this.instructionType = "SLTU";
              this.assembly = `SLTU x${this.rd}, x${this.rs1}, x${this.rs2}`;
              break;
            case 0x4:
              this.instructionType = "XOR";
              this.assembly = `XOR x${this.rd}, x${this.rs1}, x${this.rs2}`;
              break;
            case 0x5:
              if (this.funct7 === 0x00) {
                this.instructionType = "SRL";
                this.assembly = `SRL x${this.rd}, x${this.rs1}, x${this.rs2}`;
              } else if (this.funct7 === 0x20) {
                this.instructionType = "SRA";
                this.assembly = `SRA x${this.rd}, x${this.rs1}, x${this.rs2}`;
              } else {
                this.instructionType = "UNKNOWN";
                this.assembly = "UNKNOWN";
              }
              break;
            case 0x6:
              this.instructionType = "OR";
              this.assembly = `OR x${this.rd}, x${this.rs1}, x${this.rs2}`;
              break;
            case 0x7:
              this.instructionType = "AND";
              this.assembly = `AND x${this.rd}, x${this.rs1}, x${this.rs2}`;
              break;
            default:
              this.instructionType = "UNKNOWN";
              this.assembly = "UNKNOWN";
          }
          break;

        case 0x13: // 0010011 in binary, decimal 19
        case 0x03: // 0000011 in binary, decimal 3
        case 0x67: // 1100111 in binary, decimal 103
        case 0x73: // 1110011 in binary, decimal 115
          // I-type instructions (Immediate arithmetic, loads, jalr, system instructions)
          this.format = "I";
          this.rd = (instr[0] >>> 7) & 0x1f; // bits [11:7]
          this.funct3 = (instr[0] >>> 12) & 0x7; // bits [14:12]
          this.rs1 = (instr[0] >>> 15) & 0x1f; // bits [19:15]
          this.imm = (instr[0] >>> 20) & 0xfff; // bits [31:20]
          // Sign-extend immediate
          if (this.imm & 0x800) {
            this.imm |= 0xfffff000;
          }

          switch (this.opcode) {
            case 0x13: // Immediate arithmetic instructions
              switch (this.funct3) {
                case 0x0:
                  this.instructionType = "ADDI";
                  this.assembly = `ADDI x${this.rd}, x${this.rs1}, ${this.imm}`;
                  break;
                case 0x2:
                  this.instructionType = "SLTI";
                  this.assembly = `SLTI x${this.rd}, x${this.rs1}, ${this.imm}`;
                  break;
                case 0x3:
                  this.instructionType = "SLTIU";
                  this.assembly = `SLTIU x${this.rd}, x${this.rs1}, ${this.imm}`;
                  break;
                case 0x4:
                  this.instructionType = "XORI";
                  this.assembly = `XORI x${this.rd}, x${this.rs1}, ${this.imm}`;
                  break;
                case 0x6:
                  this.instructionType = "ORI";
                  this.assembly = `ORI x${this.rd}, x${this.rs1}, ${this.imm}`;
                  break;
                case 0x7:
                  this.instructionType = "ANDI";
                  this.assembly = `ANDI x${this.rd}, x${this.rs1}, ${this.imm}`;
                  break;
                case 0x1:
                  this.shamt = (instr[0] >>> 20) & 0x1f; // Shift amount for SLLI
                  this.instructionType = "SLLI";
                  this.assembly = `SLLI x${this.rd}, x${this.rs1}, ${this.shamt}`;
                  break;
                case 0x5:
                  this.shamt = (instr[0] >>> 20) & 0x1f; // Shift amount
                  this.funct7 = (instr[0] >>> 25) & 0x7f; // bits [31:25]
                  if (this.funct7 === 0x00) {
                    this.instructionType = "SRLI";
                    this.assembly = `SRLI x${this.rd}, x${this.rs1}, ${this.shamt}`;
                  } else if (this.funct7 === 0x20) {
                    this.instructionType = "SRAI";
                    this.assembly = `SRAI x${this.rd}, x${this.rs1}, ${this.shamt}`;
                  } else {
                    this.instructionType = "UNKNOWN";
                    this.assembly = "UNKNOWN";
                  }
                  break;
                default:
                  this.instructionType = "UNKNOWN";
                  this.assembly = "UNKNOWN";
              }
              break;

            case 0x03: // Load instructions
              switch (this.funct3) {
                case 0x0:
                  this.instructionType = "LB";
                  this.assembly = `LB x${this.rd}, ${this.imm}(x${this.rs1})`;
                  break;
                case 0x1:
                  this.instructionType = "LH";
                  this.assembly = `LH x${this.rd}, ${this.imm}(x${this.rs1})`;
                  break;
                case 0x2:
                  this.instructionType = "LW";
                  this.assembly = `LW x${this.rd}, ${this.imm}(x${this.rs1})`;
                  break;
                case 0x4:
                  this.instructionType = "LBU";
                  this.assembly = `LBU x${this.rd}, ${this.imm}(x${this.rs1})`;
                  break;
                case 0x5:
                  this.instructionType = "LHU";
                  this.assembly = `LHU x${this.rd}, ${this.imm}(x${this.rs1})`;
                  break;
                default:
                  this.instructionType = "UNKNOWN";
                  this.assembly = "UNKNOWN";
              }
              break;

            case 0x67: // JALR instruction
              if (this.funct3 === 0x0) {
                this.instructionType = "JALR";
                this.assembly = `JALR x${this.rd}, x${this.rs1}, ${this.imm}`;
              } else {
                this.instructionType = "UNKNOWN";
                this.assembly = "UNKNOWN";
              }
              break;

            case 0x73: // System instructions
              switch (this.funct3) {
                case 0x0:
                  if (this.imm === 0) {
                    this.instructionType = "ECALL";
                    this.assembly = "ECALL";
                  } else if (this.imm === 1) {
                    this.instructionType = "EBREAK";
                    this.assembly = "EBREAK";
                  } else {
                    this.instructionType = "UNKNOWN";
                    this.assembly = "UNKNOWN";
                  }
                  break;
                case 0x1:
                  this.instructionType = "CSRRW";
                  this.assembly = `CSRRW x${this.rd}, x${this.rs1}, ${this.imm}`;
                  break;
                case 0x2:
                  this.instructionType = "CSRRS";
                  this.assembly = `CSRRS x${this.rd}, x${this.rs1}, ${this.imm}`;
                  break;
                case 0x3:
                  this.instructionType = "CSRRC";
                  this.assembly = `CSRRC x${this.rd}, x${this.rs1}, ${this.imm}`;
                  break;
                case 0x5:
                  this.instructionType = "CSRRWI";
                  this.assembly = `CSRRWI x${this.rd}, x${this.rs1}, ${this.imm}`;
                  break;
                case 0x6:
                  this.instructionType = "CSRRSI";
                  this.assembly = `CSRRSI x${this.rd}, x${this.rs1}, ${this.imm}`;
                  break;
                case 0x7:
                  this.instructionType = "CSRRCI";
                  this.assembly = `CSRRCI x${this.rd}, x${this.rs1}, ${this.imm}`;
                  break;
                default:
                  this.instructionType = "UNKNOWN";
                  this.assembly = "UNKNOWN";
              }
              break;

            default:
              this.instructionType = "UNKNOWN";
              this.assembly = "UNKNOWN";
          }
          break;

        case 0x23: // 0100011 in binary, decimal 35
          // S-type instructions (Store instructions)
          this.format = "S";
          this.funct3 = (instr[0] >>> 12) & 0x7; // bits [14:12]
          this.rs1 = (instr[0] >>> 15) & 0x1f; // bits [19:15]
          this.rs2 = (instr[0] >>> 20) & 0x1f; // bits [24:20]
          this.imm =
            ((instr[0] >>> 7) & 0x1f) | (((instr[0] >>> 25) & 0x7f) << 5);
          // Sign-extend immediate
          if (this.imm & 0x800) {
            this.imm |= 0xfffff000;
          }

          switch (this.funct3) {
            case 0x0:
              this.instructionType = "SB";
              this.assembly = `SB x${this.rs2}, ${this.imm}(x${this.rs1})`;
              break;
            case 0x1:
              this.instructionType = "SH";
              this.assembly = `SH x${this.rs2}, ${this.imm}(x${this.rs1})`;
              break;
            case 0x2:
              this.instructionType = "SW";
              this.assembly = `SW x${this.rs2}, ${this.imm}(x${this.rs1})`;
              break;
            default:
              this.instructionType = "UNKNOWN";
              this.assembly = "UNKNOWN";
          }
          break;

        case 0x63: // 1100011 in binary, decimal 99
          // B-type instructions (Branch instructions)
          this.format = "B";
          this.funct3 = (instr[0] >>> 12) & 0x7; // bits [14:12]
          this.rs1 = (instr[0] >>> 15) & 0x1f; // bits [19:15]
          this.rs2 = (instr[0] >>> 20) & 0x1f; // bits [24:20]
          this.imm =
            ((instr[0] >> 7) & 0x1e) | // bits [11:8], shifted to [4:1]
            ((instr[0] >> 20) & 0x7e0) | // bits [30:25], shifted to [10:5]
            ((instr[0] << 4) & 0x800) | // bit [7], shifted to [11]
            ((instr[0] >> 19) & 0x1000); // bit [31], shifted to [12]
          // Sign-extend immediate
          if (this.imm & 0x1000) {
            this.imm |= 0xffffe000;
          }

          switch (this.funct3) {
            case 0x0:
              this.instructionType = "BEQ";
              this.assembly = `BEQ x${this.rs1}, x${this.rs2}, ${this.imm}`;
              break;
            case 0x1:
              this.instructionType = "BNE";
              this.assembly = `BNE x${this.rs1}, x${this.rs2}, ${this.imm}`;
              break;
            case 0x4:
              this.instructionType = "BLT";
              this.assembly = `BLT x${this.rs1}, x${this.rs2}, ${this.imm}`;
              break;
            case 0x5:
              this.instructionType = "BGE";
              this.assembly = `BGE x${this.rs1}, x${this.rs2}, ${this.imm}`;
              break;
            case 0x6:
              this.instructionType = "BLTU";
              this.assembly = `BLTU x${this.rs1}, x${this.rs2}, ${this.imm}`;
              break;
            case 0x7:
              this.instructionType = "BGEU";
              this.assembly = `BGEU x${this.rs1}, x${this.rs2}, ${this.imm}`;
              break;
            default:
              this.instructionType = "UNKNOWN";
              this.assembly = "UNKNOWN";
          }
          break;

        case 0x37: // 0110111 in binary, decimal 55
        case 0x17: // 0010111 in binary, decimal 23
          // U-type instructions (lui, auipc)
          this.format = "U";
          this.rd = (instr[0] >>> 7) & 0x1f; // bits [11:7]
          this.imm = instr[0] & 0xfffff000; // bits [31:12]

          // Determine instruction type based on opcode
          if (this.opcode === 0x37) {
            this.instructionType = "LUI";
            this.assembly = `LUI x${this.rd}, ${this.imm}`;
          } else if (this.opcode === 0x17) {
            this.instructionType = "AUIPC";
            this.assembly = `AUIPC x${this.rd}, ${this.imm}`;
          } else {
            this.instructionType = "UNKNOWN";
            this.assembly = "UNKNOWN";
          }
          break;

        case 0x6f: // 1101111 in binary, decimal 111
          // J-type instructions (jal)
          this.format = "J";
          this.rd = (instr[0] >>> 7) & 0x1f; // bits [11:7]
          this.imm =
            (((instr[0] >> 12) & 0xff) << 12) | // bits [19:12]
            (instr[0] & 0x80000000 ? 0xfff00000 : 0) | // Sign extension
            (((instr[0] >> 20) & 0x1) << 11) | // bit [11]
            (((instr[0] >> 21) & 0x3ff) << 1); // bits [10:1]
          // Sign-extend immediate
          if (this.imm & 0x100000) {
            this.imm |= 0xffe00000;
          }
          this.instructionType = "JAL";
          break;

        default:
          this.format = "Unknown";
          this.instructionType = "Unknown";
      }
    } else {
      this.type = assembly;
    }
  }

  getAssembly() {
    // split the assembly string into an array of strings, split in spaces
    const splitAssembly = this.assembly.split(" ");
    let formattedAssembly = "";
    let colorMap = {};
    let idMap = {};
    //color code the assembly string according to the instruction color codes

    //in the case of a R-type instruction (ADD, SUB, SLL, SLT, SLTU, XOR, SRL, SRA, OR, AND)
    switch (this.format) {
      case "R":
        // Color and ID map for "R" format
        colorMap = {
          1: getColor("--color-opcode"),
          2: getColor("--color-rd"),
          3: getColor("--color-rs1"),
          4: getColor("--color-rs2"),
          5: getColor("--color-funct7"),
        };

        idMap = {
          1: "opcode",
          2: "rd",
          3: "rs1",
          4: "rs2",
          5: "funct7",
        };

        for (let i = 0; i < splitAssembly.length; i++) {
          formattedAssembly += `<span id="${idMap[i + 1]}"
           style="color: ${colorMap[i + 1]};">${splitAssembly[i]}</span> `;
        }

        return formattedAssembly;

      case "I":
        // Color and ID map for "I" format
        colorMap = {
          1: getColor("--color-opcode"),
          2: getColor("--color-rd"),
          3: getColor("--color-rs1"),
          4: getColor("--color-funct7"),
        };

        idMap = {
          1: "opcode",
          2: "rd",
          3: "rs1",
          4: "imm",
        };

        for (let i = 0; i < splitAssembly.length; i++) {
          formattedAssembly += `<span id="${idMap[i + 1]}"
           style="color: ${colorMap[i + 1]};">${splitAssembly[i]}</span> `;
        }
        return formattedAssembly;

      case "S":
        // Color and ID map for "S" format
        colorMap = {
          1: getColor("--color-opcode"),
          2: getColor("--color-rs2"),
          3: getColor("--color-funct7"),
          4: getColor("--color-rs1"),
        };

        idMap = {
          1: "opcode",
          2: "rs2",
          3: "imm",
          4: "rs1",
        };

        for (let i = 0; i < splitAssembly.length; i++) {
          formattedAssembly += `<span id="${idMap[i + 1]}"
           style="color: ${colorMap[i + 1]};">${splitAssembly[i]}</span> `;
        }
        return formattedAssembly;

      case "B":
        // Color and ID map for "B" format
        colorMap = {
          1: getColor("--color-opcode"),
          2: getColor("--color-rs1"),
          3: getColor("--color-rs2"),
          4: getColor("--color-funct7"),
        };

        idMap = {
          1: "opcode",
          2: "rs1",
          3: "rs2",
          4: "imm",
        };

        for (let i = 0; i < splitAssembly.length; i++) {
          formattedAssembly += `<span id="${idMap[i + 1]}"
           style="color: ${colorMap[i + 1]};">${splitAssembly[i]}</span> `;
        }
        return formattedAssembly;

      case "U":
        // Color and ID map for "U" format
        colorMap = {
          1: getColor("--color-opcode"),
          2: getColor("--color-rd"),
          3: getColor("--color-funct7"),
        };

        idMap = {
          1: "opcode",
          2: "rd",
          3: "imm",
        };

        for (let i = 0; i < splitAssembly.length; i++) {
          formattedAssembly += `<span id="${idMap[i + 1]}"
           style="color: ${colorMap[i + 1]};">${splitAssembly[i]}</span> `;
        }
        return formattedAssembly;

      case "J":
        // Color and ID map for "J" format
        colorMap = {
          1: getColor("--color-opcode"),
          2: getColor("--color-rd"),
          3: getColor("--color-funct7"),
        };

        idMap = {
          1: "opcode",
          2: "rd",
          3: "imm",
        };

        for (let i = 0; i < splitAssembly.length; i++) {
          formattedAssembly += `<span id="${idMap[i + 1]}"
           style="color: ${colorMap[i + 1]};">${splitAssembly[i]}</span> `;
        }
        return formattedAssembly;

      default:
        return this.assembly;
    }
  }

  getDecimal() {
    return this.decimal;
  }

  getBinary() {
    return this.binary;
  }
  getHex() {
    return "0x" + this.decimal.toString(16).padStart(8, "0"); // Padding to ensure 8 digits for 32-bit values
  }

  getFormat() {
    return this.format;
  }

  colorCodeR(instruction) {
    return `
      <span id="funct7" style="color: ${getColor("--color-funct7")};"
        onmouseover="showTooltip(event, 'funct7','${instruction}'); style.backgroundColor='${getColor(
      "--color-hover-bg"
    )}';"
        onmouseout="hideTooltip('funct7','${instruction}'); style.backgroundColor='';">
        ${instruction.slice(0, 7)}
      </span>
      <span id="rs2" style="color: ${getColor("--color-rs2")};"
        onmouseover="showTooltip(event, 'rs2','${instruction}'); style.backgroundColor='${getColor(
      "--color-hover-bg"
    )}';"
        onmouseout="hideTooltip('rs2','${instruction}'); style.backgroundColor='';">
        ${instruction.slice(7, 12)}
      </span>
      <span id="rs1" style="color: ${getColor("--color-rs1")};"
        onmouseover="showTooltip(event, 'rs1','${instruction}'); style.backgroundColor='${getColor(
      "--color-hover-bg"
    )}';"
        onmouseout="hideTooltip('rs1','${instruction}'); style.backgroundColor='';">
        ${instruction.slice(12, 17)}
      </span>
      <span id="funct3" style="color: ${getColor("--color-funct3")};"
        onmouseover="showTooltip(event, 'funct3','${instruction}'); style.backgroundColor='${getColor(
      "--color-hover-bg"
    )}';"
        onmouseout="hideTooltip('funct3','${instruction}'); style.backgroundColor='';">
        ${instruction.slice(17, 20)}
      </span>
      <span id="rd" style="color: ${getColor("--color-rd")};"
        onmouseover="showTooltip(event, 'rd','${instruction}'); style.backgroundColor='${getColor(
      "--color-hover-bg"
    )}';"
        onmouseout="hideTooltip('rd','${instruction}'); style.backgroundColor='';">
        ${instruction.slice(20, 25)}
      </span>
      <span id="opcode" style="color: ${getColor("--color-opcode")};"
        onmouseover="showTooltip(event, 'opcode','${instruction}'); style.backgroundColor='${getColor(
      "--color-hover-bg"
    )}';"
        onmouseout="hideTooltip('opcode','${instruction}'); style.backgroundColor='';">
        ${instruction.slice(25, 32)}
      </span>
    `;
  }

  colorCodeI(instruction) {
    return `
      <span id="imm" style="color: ${getColor("--color-funct7")};"
        onmouseover="showTooltip(event, 'imm','${instruction}'); style.backgroundColor='${getColor(
      "--color-hover-bg"
    )}';"
        onmouseout="hideTooltip('imm','${instruction}'); style.backgroundColor='';">
        ${instruction.slice(0, 12)}
      </span>
      <span id="rs1" style="color: ${getColor("--color-rs1")};"
        onmouseover="showTooltip(event, 'rs1','${instruction}'); style.backgroundColor='${getColor(
      "--color-hover-bg"
    )}';"
        onmouseout="hideTooltip('rs1','${instruction}'); style.backgroundColor='';">
        ${instruction.slice(12, 17)}
      </span>
      <span id="funct3" style="color: ${getColor("--color-funct3")};"
        onmouseover="showTooltip(event, 'funct3','${instruction}'); style.backgroundColor='${getColor(
      "--color-hover-bg"
    )}';"
        onmouseout="hideTooltip('funct3','${instruction}'); style.backgroundColor='';">
        ${instruction.slice(17, 20)}
      </span>
      <span id="rd" style="color: ${getColor("--color-rd")};"
        onmouseover="showTooltip(event, 'rd','${instruction}'); style.backgroundColor='${getColor(
      "--color-hover-bg"
    )}';"
        onmouseout="hideTooltip('rd','${instruction}'); style.backgroundColor='';">
        ${instruction.slice(20, 25)}
      </span>
      <span id="opcode" style="color: ${getColor("--color-opcode")};"
        onmouseover="showTooltip(event, 'opcode','${instruction}'); style.backgroundColor='${getColor(
      "--color-hover-bg"
    )}';"
        onmouseout="hideTooltip('opcode','${instruction}'); style.backgroundColor='';">
        ${instruction.slice(25, 32)}
      </span>
    `;
  }

  colorCodeS(instruction) {
    return `
      <span id="imm" style="color: ${getColor("--color-funct7")};"
        title="imm"
        onmouseover="showTooltip(event, 'imm','${instruction}'); style.backgroundColor='${getColor(
      "--color-hover-bg"
    )}';"
        onmouseout="hideTooltip('imm','${instruction}'); style.backgroundColor='';">
        ${instruction.slice(0, 7)}${instruction.slice(20, 25)}
      </span>
      <span id="rs2" style="color: ${getColor("--color-rs2")};"
        title="rs2"
        onmouseover="showTooltip(event, 'rs2','${instruction}'); style.backgroundColor='${getColor(
      "--color-hover-bg"
    )}';"
        onmouseout="hideTooltip('rs2','${instruction}'); style.backgroundColor='';">
        ${instruction.slice(7, 12)}
      </span>
      <span id="rs1" style="color: ${getColor("--color-rs1")};"
        title="rs1"
        onmouseover="showTooltip(event, 'rs1','${instruction}'); style.backgroundColor='${getColor(
      "--color-hover-bg"
    )}';"
        onmouseout="hideTooltip('rs1','${instruction}'); style.backgroundColor='';">
        ${instruction.slice(12, 17)}
      </span>
      <span id="funct3" style="color: ${getColor("--color-funct3")};"
        title="funct3"
        onmouseover="showTooltip(event, 'funct3','${instruction}'); style.backgroundColor='${getColor(
      "--color-hover-bg"
    )}';"
        onmouseout="hideTooltip('funct3','${instruction}'); style.backgroundColor='';">
        ${instruction.slice(17, 20)}
      </span>
      <span id="opcode" style="color: ${getColor("--color-opcode")};"
        title="opcode"
        onmouseover="showTooltip(event, 'opcode','${instruction}'); style.backgroundColor='${getColor(
      "--color-hover-bg"
    )}';"
        onmouseout="hideTooltip('opcode','${instruction}'); style.backgroundColor='';">
        ${instruction.slice(25, 32)}
      </span>
    `;
  }

  colorCodeB(instruction) {
    return `
      <span id="imm" style="color: ${getColor("--color-funct7")};"
        title="imm"
        onmouseover="showTooltip(event, 'imm','${instruction}'); style.backgroundColor='${getColor(
      "--color-hover-bg"
    )}';"
        onmouseout="hideTooltip('imm','${instruction}'); style.backgroundColor='';">
        ${instruction.slice(0, 7)}${instruction.slice(20, 25)}
      </span>
      <span id="rs2" style="color: ${getColor("--color-rs2")};"
        title="rs2"
        onmouseover="showTooltip(event, 'rs2','${instruction}'); style.backgroundColor='${getColor(
      "--color-hover-bg"
    )}';"
        onmouseout="hideTooltip('rs2','${instruction}'); style.backgroundColor='';">
        ${instruction.slice(7, 12)}
      </span>
      <span id="rs1" style="color: ${getColor("--color-rs1")};"
        title="rs1"
        onmouseover="showTooltip(event, 'rs1','${instruction}'); style.backgroundColor='${getColor(
      "--color-hover-bg"
    )}';"
        onmouseout="hideTooltip('rs1','${instruction}'); style.backgroundColor='';">
        ${instruction.slice(12, 17)}
      </span>
      <span id="funct3" style="color: ${getColor("--color-funct3")};"
        title="funct3"
        onmouseover="showTooltip(event, 'funct3','${instruction}'); style.backgroundColor='${getColor(
      "--color-hover-bg"
    )}';"
        onmouseout="hideTooltip('funct3','${instruction}'); style.backgroundColor='';">
        ${instruction.slice(17, 20)}
      </span>
      <span id="opcode" style="color: ${getColor("--color-opcode")};"
        title="opcode"
        onmouseover="showTooltip(event, 'opcode','${instruction}'); style.backgroundColor='${getColor(
      "--color-hover-bg"
    )}';"
        onmouseout="hideTooltip('opcode','${instruction}'); style.backgroundColor='';">
        ${instruction.slice(25, 32)}
      </span>
    `;
  }

  colorCodeU(instruction) {
    return `
      <span id="imm" style="color: ${getColor("--color-funct7")};"
        title="imm"
        onmouseover="showTooltip(event, 'imm','${instruction}'); style.backgroundColor='${getColor(
      "--color-hover-bg"
    )}';"
        onmouseout="hideTooltip('imm','${instruction}'); style.backgroundColor='';">
        ${instruction.slice(0, 20)}
      </span>
      <span id="rd" style="color: ${getColor("--color-rd")};"
        title="rd"
        onmouseover="showTooltip(event, 'rd','${instruction}'); style.backgroundColor='${getColor(
      "--color-hover-bg"
    )}';"
        onmouseout="hideTooltip('rd','${instruction}'); style.backgroundColor='';">
        ${instruction.slice(20, 25)}
      </span>
      <span id="opcode" style="color: ${getColor("--color-opcode")};"
        title="opcode"
        onmouseover="showTooltip(event, 'opcode','${instruction}'); style.backgroundColor='${getColor(
      "--color-hover-bg"
    )}';"
        onmouseout="hideTooltip('opcode','${instruction}'); style.backgroundColor='';">
        ${instruction.slice(25, 32)}
      </span>
    `;
  }

  colorCodeJ(instruction) {
    return `
      <span id="imm" style="color: ${getColor("--color-funct7")};"
        title="imm"
        onmouseover="showTooltip(event, 'imm','${instruction}'); style.backgroundColor='${getColor(
      "--color-hover-bg"
    )}';"
        onmouseout="hideTooltip('imm','${instruction}'); style.backgroundColor='';">
        ${instruction.slice(0, 20)}
      </span>
      <span id="rd" style="color: ${getColor("--color-rd")};"
        title="rd"
        onmouseover="showTooltip(event, 'rd','${instruction}'); style.backgroundColor='${getColor(
      "--color-hover-bg"
    )}';"
        onmouseout="hideTooltip('rd','${instruction}'); style.backgroundColor='';">
        ${instruction.slice(20, 25)}
      </span>
      <span id="opcode" style="color: ${getColor("--color-opcode")};"
        title="opcode"
        onmouseover="showTooltip(event, 'opcode','${instruction}'); style.backgroundColor='${getColor(
      "--color-hover-bg"
    )}';"
        onmouseout="hideTooltip('opcode','${instruction}'); style.backgroundColor='';">
        ${instruction.slice(25, 32)}
      </span>
    `;
  }

  colorCode(instruction) {
    switch (this.format) {
      case "R":
        return this.colorCodeR(instruction);
      case "I":
        return this.colorCodeI(instruction);
      case "S":
        return this.colorCodeS(instruction);
      case "B":
        return this.colorCodeB(instruction);
      case "U":
        return this.colorCodeU(instruction);
      case "J":
        return this.colorCodeJ(instruction);
      default:
        return "Unknown format";
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const gearIcon = document.getElementById("gear");
  gearIcon.addEventListener("click", handleGearClick);

  const inputBox = document.getElementById("input-box");
  inputBox.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      handleGearClick();
    }
  });
});

function createTooltip() {
  const tooltip = document.createElement("div");
  tooltip.className = "tooltip";
  tooltip.style.position = "absolute"; // Ensure absolute positioning
  tooltip.style.display = "none"; // Start hidden
  document.body.appendChild(tooltip);
  return tooltip;
}

const tooltip = createTooltip();

window.showTooltip = function (_event, text, instruction) {
  tooltip.textContent = text;
  tooltip.style.display = "block";
  const instructionDiv = document.getElementById(`'${instruction}'`);
  console.log(instructionDiv);
  if (instructionDiv) {
    instructionDiv.querySelector(`#${text}`).style.backgroundColor =
      getColor("--color-hover-bg");
  }
};

window.hideTooltip = function (text, instruction) {
  const instructionDiv = document.getElementById(`'${instruction}'`);
  if (instructionDiv) {
    instructionDiv.querySelector(`#${text}`).style.backgroundColor = "";
  }
  tooltip.style.display = "none";
};
// Move tooltip to follow the cursor position
document.addEventListener("mousemove", (event) => {
  tooltip.style.left = `${event.pageX + 10}px`;
  tooltip.style.top = `${event.pageY + 10}px`;
});

function getColor(variable) {
  return getComputedStyle(document.documentElement).getPropertyValue(variable);
}

function handleGearClick() {
  const inputBox = document.getElementById("input-box");
  const resultDiv = document.getElementById("result");
  const input = inputBox.value.trim();
  let instructionType;

  if (/^[01]+$/.test(input)) {
    instructionType = "Binary";
  } else if (/^[0-9A-Fa-f]+$/.test(input)) {
    instructionType = "Hex";
  } else if (/^\d+$/.test(input)) {
    instructionType = "Decimal";
  } else if (/^[a-zA-Z]+$/.test(input)) {
    // instructionType = "Assembly";
    instructionType = "Invalid";
  } else {
    instructionType = "Invalid";
  }

  if (instructionType === "Invalid") {
    resultDiv.textContent = "Invalid input";
    const container = document.getElementById("input-container");
    container.style.setProperty("border-color", "#cc0000", "important");
    return;
  } else {
    const container = document.getElementById("input-container");
    container.style.setProperty("border-color", "#ccc", "important");
    decode(instructionType, input, resultDiv);
  }
}

function decode(type, instruction, resultDiv) {
  switch (type) {
    case "Binary":
      decodeBinaryInstruction(instruction, resultDiv);
      break;
    case "Hex":
      decodeBinaryInstruction(parseInt(instruction, 16).toString(2), resultDiv);
      break;
    case "Decimal":
      decodeBinaryInstruction(parseInt(instruction).toString(2), resultDiv);
      break;
    case "Assembly":
      // decodeAssemblyInstruction(instruction, resultDiv);
      break;
    default:
      content = "Error: Invalid input";
  }
}

//ex. 00000000000000000000000010000011
const decodeBinaryInstruction = (instruction, resultDiv) => {
  const instrInBit = new Uint32Array([parseInt(instruction, 2)]);
  const instr = new Instruction(0, instrInBit, instruction);

  resultDiv.innerHTML += `
  <div id="'${instruction}'" class="instruction">
    <br>
    Assembly: ${instr.getAssembly()}<br>
    Hex: ${instr.getHex()} <br>
    Format: ${instr.getFormat()} Type <br>
    <b>${instr.colorCode(instruction)}</b><br>
    -----------------------------------------
    <br>
  </div>

  `;
};
