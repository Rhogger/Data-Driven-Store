export interface PreferencesInput {
  id_cliente: number;
  preferencias: number[];
}

export interface PreferencesDocument {
  id_cliente: number;
  preferencias: number[];
  _id?: any;
}
