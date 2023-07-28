export const getApiEndpoint = () => {
  return "http://127.0.0.1:5000/api";
};

export const getBackend = () => {
  // The backend was originally written using a Flask-based REST server.
  // The REST server is being migrated to an Electron-based application.
  // However, both backends are still supported for now.
  return "electron"; //"rest"; // | electron
};
