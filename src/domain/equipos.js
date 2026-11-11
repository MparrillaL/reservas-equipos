// Listas blancas (whitelists): cualquier valor que no esté aquí se rechaza.
// Es más seguro que una lista negra, porque no hay que acordarse de prohibir cada caso nuevo:
// solo lo que aparece en la lista está permitido, todo lo demás queda excluido por defecto.
export const TIPOS_EQUIPO = ["sobremesa", "portatil"];
export const ESTADOS_EQUIPO = ["operativo", "fuera_de_servicio"];
