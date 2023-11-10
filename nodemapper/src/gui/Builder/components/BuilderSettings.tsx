import React from "react";
import { useAppDispatch } from "redux/store/hooks";
import { useAppSelector } from "redux/store/hooks";
import { builderSetSnakemakeArgs } from "redux/actions";
import { builderSetEnvironmentVars } from "redux/actions";
import { builderSelectSnakemakeBackend } from "redux/actions";
import { builderSetDisplayModuleSettings } from "redux/actions";
import { builderSetAutoValidateConnections } from "redux/actions";
import RepoOptions from "./RepoOptions";

const default_input_size = 35;
const panel_background_color = "#2e3746";

const BuilderSettings = () => {
  const dispatch = useAppDispatch();
  const isvisible = useAppSelector((state) => state.builder.settings_visible);
  const snakemake_backend = useAppSelector(
    (state) => state.builder.snakemake_backend
  );
  const snakemake_args = useAppSelector(
    (state) => state.builder.snakemake_args
  );
  const environment_vars = useAppSelector(
    (state) => state.builder.environment_variables
  );
  const display_module_settings = useAppSelector(
    (state) => state.builder.display_module_settings
  );
  const auto_validate_connections = useAppSelector(
    (state) => state.builder.auto_validate_connections
  );

  const SetSnakemakeArgs = (args: string) => {
    dispatch(builderSetSnakemakeArgs(args));
  };

  const SetEnvironmentVars = (args: string) => {
    dispatch(builderSetEnvironmentVars(args));
  };

  const selectSnakemakeBackend = (value: string) => {
    dispatch(builderSelectSnakemakeBackend(value));
  };

  const SetDisplayModuleSettings = (value: boolean) => {
    dispatch(builderSetDisplayModuleSettings(value));
  };

  const SetAutoValidateConnections = (value: boolean) => {
    dispatch(builderSetAutoValidateConnections(value));
  };

  return (
    <>
      <div
        style={{
          display: "flex",
          width: "100%",
          flexDirection: "column",
          justifyContent: "flex-start",
          alignSelf: "flex-start",
          padding: "10px",
          gap: "10px",
        }}
      >
        <div>
          <RepoOptions />
        </div>
        <div>
          <div
            style={{
              backgroundColor: panel_background_color,
              padding: "5px",
            }}
          >
            <p>
              <b>Snakemake</b>
            </p>
            <p>Backend</p>
            <p>
              <select
                defaultValue={snakemake_backend}
                onChange={(e) => selectSnakemakeBackend(e.target.value)}
                style={{ width: "100%" }}
              >
                <option value="builtin">Built-in</option>
                <option value="system">System</option>
              </select>
            </p>
            <p>Arguments</p>
            <p>
              <input
                id="inputBuilderSettingsSnakemakeArgs"
                type="text"
                size={default_input_size}
                value={snakemake_args}
                onChange={(e) => SetSnakemakeArgs(e.target.value)}
                style={{ width: "100%" }}
              />
            </p>
          </div>
        </div>
        <div>
          <div
            style={{
              backgroundColor: panel_background_color,
              padding: "5px",
            }}
          >
            <p>
              <b>Environment</b>
            </p>
            <p>Variables</p>
            <p>
              <input
                id="inputBuilderSettingsEnvironmentVars"
                type="text"
                size={default_input_size}
                value={environment_vars}
                onChange={(e) => SetEnvironmentVars(e.target.value)}
                style={{ width: "100%" }}
              />
            </p>
          </div>
        </div>
        <div>
          <div
            style={{
              backgroundColor: panel_background_color,
              padding: "5px",
            }}
          >
            <p>
              <b>Interface</b>
            </p>
            <p>
              <input
                type="checkbox"
                id="display_module_settings"
                checked={display_module_settings}
                onChange={(e) => SetDisplayModuleSettings(e.target.checked)}
              />
              <label htmlFor="display_module_settings">
                {" "}
                Display module settings
              </label>
            </p>
            <p>
              <input
                type="checkbox"
                id="auto_validate_connections"
                checked={auto_validate_connections}
                onChange={(e) => SetAutoValidateConnections(e.target.checked)}
              />
              <label htmlFor="auto_validate_connections">
                {" "}
                Auto-validate connections
              </label>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default BuilderSettings;
