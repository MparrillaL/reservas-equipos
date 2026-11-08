// Clase base: todos los errores "previstos" de la aplicación heredan de aquí
export class ErrorDominio extends Error {
  constructor(mensaje) {
    super(mensaje);
    this.name = this.constructor.name;   // Para saber qué tipo de error es
  }
}

export class ErrorValidacion extends ErrorDominio {      // → 400
  constructor(errores, mensaje = 'Datos incorrectos') {
    super(mensaje);
    this.errores = errores;   // { campo: 'mensaje' } para mostrarlos en el formulario
  }
}
// Estos tipos permiten distinguir fallos de acceso, búsqueda y reglas de negocio.
export class ErrorCredenciales extends ErrorDominio {}   // → 401
export class ErrorProhibido extends ErrorDominio {}      // → 403
export class ErrorNoEncontrado extends ErrorDominio {}   // → 404
export class ErrorConflicto extends ErrorDominio {}      // → 409