// Normaliza texto para pesquisa: minúsculas + remove acentos/diacríticos.
// Assim "obstipacao" encontra "obstipação" e vice-versa.
export function normalizar(s) {
  return (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
