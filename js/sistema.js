class Sistema {
    constructor() {
        this.contrataciones = [];
        this.paseadores = [];
        this.clientes = [];
        this.userLogged = null;
    }

    // Validar que el username no exista
    existeUsername(username) {
        for (let i = 0; i < this.paseadores.length; i++) {
            if (this.paseadores[i].username === username) {
                return true;
            }
        }
        for (let i = 0; i < this.clientes.length; i++) {
            if (this.clientes[i].username === username) {
                return true;
            }
        }
        return false;
    }

    // NUEVA función: Validar password
    validarPassword(password) {
        if (password.length < 5) {
            return "La contraseña debe tener al menos 5 caracteres";
        }
        let tieneMayuscula = false;
        let tieneMinuscula = false;
        let tieneNumero = false;
        for (let i = 0; i < password.length; i++) {
            let c = password[i];
            if (c >= 'A' && c <= 'Z') {
                tieneMayuscula = true;
            } else if (c >= 'a' && c <= 'z') {
                tieneMinuscula = true;
            } else if (c >= '0' && c <= '9') {
                tieneNumero = true;
            }
        }
        if (!tieneMayuscula || !tieneMinuscula || !tieneNumero) {
            return "La contraseña debe tener al menos una mayúscula, una minúscula y un número";
        }
        return "ok";
    }

    // NUEVA función: Obtener cupos necesarios
    getCuposNecesarios(tamanoPerro) {
        if (tamanoPerro === "grande") {
            return 4;
        } else if (tamanoPerro === "mediano") {
            return 2;
        } else {
            return 1;
        }
    }

    // NUEVA función: Verificar compatibilidad
    esCompatible(paseador, tamanoPerro) {
        const asignados = this.getPerrosAsignados(paseador);
        for (let i = 0; i < asignados.length; i++) {
            const tamanoAsignado = asignados[i].cliente.perro.tamano;
            if (tamanoPerro === "chico" && tamanoAsignado === "grande") {
                return false;
            }
            if (tamanoPerro === "grande" && tamanoAsignado === "chico") {
                return false;
            }
        }
        return true;
    }

    registrarCliente(nombre, username, password, nombrePerro, tamanoPerro) {
        if (!nombre || !username || !password || !nombrePerro || !tamanoPerro) {
            return "Todos los campos son obligatorios";
        }
        if (this.existeUsername(username)) {
            return "El nombre de usuario ya existe";
        }
        const resultadoPassword = this.validarPassword(password);
        if (resultadoPassword !== "ok") {
            return resultadoPassword;
        }
        const perro = new Perro(nombrePerro, tamanoPerro);
        const cliente = new Cliente(nombre, username, password, perro);
        this.clientes.push(cliente);
        return "ok";
    }

    login(username, password) {
        this.userLogged = null;
        for (let i = 0; i < this.paseadores.length; i++) {
            if (this.paseadores[i].username === username && this.paseadores[i].getPassword() === password) {
                this.userLogged = this.paseadores[i];
                return "ok";
            }
        }
        for (let i = 0; i < this.clientes.length; i++) {
            if (this.clientes[i].username === username && this.clientes[i].getPassword() === password) {
                this.userLogged = this.clientes[i];
                return "ok";
            }
        }
        return "Usuario o contraseña incorrectos";
    }

    getPaseadoresDisponibles(cliente) {
        const paseadoresDisponibles = [];
        const tamanoPerro = cliente.perro.tamano;
        const cuposNecesarios = this.getCuposNecesarios(tamanoPerro);

        for (let i = 0; i < this.paseadores.length; i++) {
            const paseador = this.paseadores[i];
            const cuposOcupados = this.calcularCuposOcupados(paseador);
            const cuposDisponibles = paseador.cupoMaximo - cuposOcupados;
            if (cuposDisponibles >= cuposNecesarios && this.esCompatible(paseador, tamanoPerro)) {
                paseadoresDisponibles.push(paseador);
            }
        }
        return paseadoresDisponibles;
    }

    getContratacionActual(cliente) {
        for (let i = 0; i < this.contrataciones.length; i++) {
            if (this.contrataciones[i].cliente.id === cliente.id &&
                (this.contrataciones[i].estado === "pendiente" || this.contrataciones[i].estado === "aprobada")) {
                return this.contrataciones[i];
            }
        }
        return null;
    }

    crearContratacion(cliente, paseador) {
        const contratacion = new Contratacion(cliente, paseador);
        paseador.agregarContratacion(contratacion);
        this.contrataciones.push(contratacion);
    }

    cancelarContratacion(contratacion) {
        contratacion.estado = "cancelada";
    }

    getContratacionesPendientes(paseador) {
        const pendientes = [];
        for (let i = 0; i < this.contrataciones.length; i++) {
            if (this.contrataciones[i].paseador.id === paseador.id && this.contrataciones[i].estado === "pendiente") {
                pendientes.push(this.contrataciones[i]);
            }
        }
        return pendientes;
    }

    puedeAprobarContratacion(contratacion) {
        const paseador = contratacion.paseador;
        const tamanoPerro = contratacion.cliente.perro.tamano;
        const cuposNecesarios = this.getCuposNecesarios(tamanoPerro);
        const cuposOcupados = this.calcularCuposOcupados(paseador);
        const cuposDisponibles = paseador.cupoMaximo - cuposOcupados;

        if (cuposDisponibles < cuposNecesarios) {
            return {
                puede: false,
                motivo: `No tienes suficientes cupos disponibles. Necesitas ${cuposNecesarios} cupos pero solo tienes ${cuposDisponibles} disponibles.`
            };
        }

        if (!this.esCompatible(paseador, tamanoPerro)) {
            return {
                puede: false,
                motivo: "No se puede aceptar: incompatibilidad de tamaños entre perros."
            };
        }

        return {
            puede: true,
            motivo: "Contratación aprobada"
        };
    }

    aprobarContratacion(contratacion) {
        contratacion.estado = "aprobada";
    }

    rechazarContratacion(contratacion) {
        contratacion.estado = "rechazada";
    }

    getPerrosAsignados(paseador) {
        const asignados = [];
        for (let i = 0; i < this.contrataciones.length; i++) {
            if (this.contrataciones[i].paseador.id === paseador.id && this.contrataciones[i].estado === "aprobada") {
                asignados.push(this.contrataciones[i]);
            }
        }
        return asignados;
    }

    getInfoPaseadores() {
        const info = [];
        for (let i = 0; i < this.paseadores.length; i++) {
            const paseador = this.paseadores[i];
            const perrosAsignados = this.getPerrosAsignados(paseador);
            info.push({
                nombre: paseador.nombre,
                cantidadPerros: perrosAsignados.length
            });
        }
        return info;
    }

    agregarPaseador(paseador) {
        this.paseadores.push(paseador);
    }

    agregarCliente(cliente) {
        this.clientes.push(cliente);
    }

    agregarContratacion(contratacion) {
        this.contrataciones.push(contratacion);
    }

    calcularCuposOcupados(paseador) {
        let cuposOcupados = 0;
        for (let i = 0; i < this.contrataciones.length; i++) {
            if (this.contrataciones[i].paseador.id === paseador.id && this.contrataciones[i].estado === "aprobada") {
                const tamano = this.contrataciones[i].cliente.perro.tamano;
                cuposOcupados += this.getCuposNecesarios(tamano);
            }
        }
        return cuposOcupados;
    }
}