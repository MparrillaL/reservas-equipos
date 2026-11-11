import dotenv from "dotenv";
dotenv.config({ quiet: true }); // Carga .env en process.env (quiet: sin mensajes en consola)

const ENTORNOS_VALIDOS = ["development", "production", "test"]; // lista blanca: cualquier otro valor se rechaza

// Convierte las variables de entorno en una configuración comprobada y lista para usar.
// Recibe "env" como parámetro (en vez de leer process.env directamente) para poder probar
// esta función con valores de prueba sin tocar las variables de entorno reales del proceso.
function cargarConfig(env) {
  const errores = []; // Acumula TODOS los errores para mostrarlos juntos de una vez

  // PORT: si no viene, 3000. Number() convierte el texto ("abc" → NaN, por eso se comprueba con isInteger)
  const port = Number(env.PORT ?? 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    errores.push("PORT debe ser un entero entre 1 y 65535");
  }

  const nodeEnv = env.NODE_ENV ?? "development";
  if (!ENTORNOS_VALIDOS.includes(nodeEnv)) {
    errores.push(`NODE_ENV debe ser uno de: ${ENTORNOS_VALIDOS.join(", ")}`);
  }

  // En pruebas permitimos un secreto fijo para no depender de un .env real (los tests se
  // ejecutan en cualquier máquina, incluida la de un corrector, sin que tenga que crear un .env)
  let sessionSecret = env.SESSION_SECRET;
  if (!sessionSecret && nodeEnv === "test")
    sessionSecret = "secreto_solo_para_tests_".repeat(2);
  // 32 caracteres mínimo: dificulta que alguien adivine el secreto que firma la cookie de sesión.
  // Si un atacante conociera este secreto, podría fabricar una cookie de sesión válida para
  // cualquier usuario (incluido un admin) sin necesidad de conocer su contraseña.
  if (!sessionSecret || sessionSecret.length < 32) {
    errores.push(
      "SESSION_SECRET es obligatorio y debe tener al menos 32 caracteres",
    );
  }

  // Fail fast: si algo está mal, no arrancamos. Mejor un error claro al arrancar que un
  // servidor funcionando a medias con una configuración incompleta o insegura.
  if (errores.length > 0) {
    throw new Error("Configuración inválida:\n - " + errores.join("\n - "));
  }

  // Object.freeze: nadie puede modificar la configuración en tiempo de ejecución
  // (evita que un bug en otro módulo cambie, por accidente, el puerto o el secreto a medio arrancar).
  return Object.freeze({
    port,
    nodeEnv,
    sessionSecret,
    esProduccion: nodeEnv === "production", // se consulta en varios sitios (cookies 'secure', trust proxy...)
  });
}

// La aplicación recibe la configuración validada una sola vez al cargar este módulo.
// Al ser un "export const", todos los módulos que lo importan comparten el mismo objeto congelado.
export const config = cargarConfig(process.env);
