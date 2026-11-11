// Clase base: todos los errores "previstos" de la aplicación heredan de aquí.
// Permite distinguir errores de negocio (que ya sabemos tratar y mostrar al usuario) de errores
// de programación inesperados (bugs), que SÍ deben acabar como un 500 con traza en la consola.
export class ErrorDominio extends Error {
  constructor(mensaje) {
    super(mensaje);
    this.name = this.constructor.name; // Para saber qué tipo de error es (útil al depurar o registrar logs)
  }
}

export class ErrorValidacion extends ErrorDominio {
  // → 400: los datos de entrada no son correctos
  constructor(errores, mensaje = "Datos incorrectos") {
    super(mensaje);
    this.errores = errores; // { campo: 'mensaje' } para mostrarlos junto a cada campo del formulario
  }
}
// Estos tipos permiten distinguir fallos de acceso, búsqueda y reglas de negocio.
// El middleware de errores (gestorErrores) los traduce al código HTTP correspondiente con un
// simple "instanceof", sin que los servicios tengan que importar nada relacionado con Express.
export class ErrorCredenciales extends ErrorDominio {} // → 401: no autenticado / credenciales incorrectas
export class ErrorProhibido extends ErrorDominio {} // → 403: autenticado, pero sin permiso (rol o propiedad del recurso)
export class ErrorNoEncontrado extends ErrorDominio {} // → 404: el recurso solicitado no existe
export class ErrorConflicto extends ErrorDominio {} // → 409: la petición es válida, pero choca con el estado actual (p. ej. ya reservado)
