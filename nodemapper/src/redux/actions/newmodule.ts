import { createAction } from '@reduxjs/toolkit';

export const newmoduleBuild = createAction('newmodule/build');
export const newmoduleValidate = createAction('newmodule/validate');
export const newmoduleOpenModuleFolder = createAction('newmodule/open-module-folder');

export const newmoduleUpdateConfig = createAction<Record<string, any> | undefined>(
  'newmodule/update-config',
); // eslint-disable-line @typescript-eslint/no-explicit-any
export const newmoduleEnvCondaSearch = createAction<Record<string, any> | undefined>(
  'newmodule/env-conda-search',
); // eslint-disable-line @typescript-eslint/no-explicit-any
export const newmoduleEnvCondaSearchUpdatePackageList = createAction<any[]>(
  'newmodule/env-conda-search-update-package-list',
); // eslint-disable-line @typescript-eslint/no-explicit-any
