import dotenv from 'dotenv';
dotenv.config({ quiet: true });          // Carga .env en process.env (quiet: sin mensajes en consola)

const ENTORNOS_VALIDOS = ['development', 'production', 'test'];

// Convierte las variables de entorno en una configuración comprobada y lista para usar.
function cargarConfig(env) {
  const errores = [];                    // Acumula TODOS los errores para mostrarlos juntos

  // PORT: si no viene, 3000. Number() convierte el texto ("abc" → NaN)
  const port = Number(env.PORT ?? 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    errores.push('PORT debe ser un entero entre 1 y 65535');
  }

  const nodeEnv = env.NODE_ENV ?? 'development';
  if (!ENTORNOS_VALIDOS.includes(nodeEnv)) {
    errores.push(`NODE_ENV debe ser uno de: ${ENTORNOS_VALIDOS.join(', ')}`);
  }

  // En pruebas permitimos un secreto fijo para no depender de un .env real
  let sessionSecret = env.SESSION_SECRET;
  if (!sessionSecret && nodeEnv === 'test') sessionSecret = 'secreto_solo_para_tests_'.repeat(2);
  if (!sessionSecret || sessionSecret.length < 32) {
    errores.push('SESSION_SECRET es obligatorio y debe tener al menos 32 caracteres');
  }

  // Fail fast: si algo está mal, no arrancamos
  if (errores.length > 0) {
    throw new Error('Configuración inválida:\n - ' + errores.join('\n - '));
  }

  // Object.freeze: nadie puede modificar la configuración en tiempo de ejecución
  return Object.freeze({
    port,
    nodeEnv,
    sessionSecret,
    esProduccion: nodeEnv === 'production',
  });
}

// La aplicación recibe la configuración validada una sola vez al cargar este módulo.
export const config = cargarConfig(process.env);