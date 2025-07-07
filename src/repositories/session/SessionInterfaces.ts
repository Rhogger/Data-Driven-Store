export interface SessionData {
  id_cliente: string;
  token: string;
  refresh_token: string;
}

export interface CreateSessionInput {
  id_cliente: string;
  token: string;
  refresh_token: string;
}
