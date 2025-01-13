import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import { DialogAlert } from 'components/DialogAlert';
import { DialogConfirm } from 'components/DialogConfirm';
import { NestedMenuItem, useMenu } from 'components/DropdownMenu';
import React, { forwardRef } from 'react';
import { useAppDispatch, useAppSelector } from 'redux/store/hooks';
import { HeaderDialogPromptProps } from '../Header';

interface MenuBuildModuleProps {
  label: string;
  disabled?: boolean;
  build_fcn: (string?) => any;
  promptDialog: HeaderDialogPromptProps;
}

export const MenuBuildModule = forwardRef(
  ({ label, disabled, build_fcn, promptDialog }: MenuBuildModuleProps, ref) => {
    // Defaults
    disabled = disabled || false;

    // State
    const dispatch = useAppDispatch();
    const modules_list = useAppSelector((state) => state.builder.modules_list);
    const repositories = useAppSelector((state) => state.settings.repositories);
    const { closeAllMenus } = useMenu();

    // Alert dialogs
    const [alertOpen, setAlertOpen] = React.useState(false);
    const [alertTitle, setAlertTitle] = React.useState('');
    const [alertContent, setAlertContent] = React.useState('');

    // Dummy modules list stores new projects until they contain modules
    // This list reinitialises each time the Build menu is opened
    const [dummy_modules_list, setDummyModulesList] = React.useState([]);

    // Build as module
    const btnBuildAsModule = () => {
      dispatch(build_fcn());
      closeAllMenus();
    };

    // Build module to existing path
    const btnBuildToPath = (repo: string, org: string, type: string, name: string) => {
      dispatch(build_fcn(`${repo}/workflows/${org}/${type}s/${name}`));
      closeAllMenus();
    };

    // Utility functions

    const LookupRepoName = (repo: string) => {
      for (let i = 0; i < repositories.length; i++) {
        if (repositories[i].repo === repo) {
          return repositories[i].label;
        }
      }
      return repo;
    };

    const LookupModuleType = (repo: string, org: string, name: string) => {
      for (let i = 0; i < modules_list.length; i++) {
        if (
          modules_list[i].repo.url === repo &&
          modules_list[i].org === org &&
          modules_list[i].name === name
        ) {
          return modules_list[i].type;
        }
      }
      return 'module'; // default to 'module' folder
    };

    const LookupProject = (repo: string, org: string) => {
      for (let i = 0; i < modules_list.length; i++) {
        if (modules_list[i].repo.url === repo && modules_list[i].org === org) {
          return true;
        }
      }
      return false;
    };

    const LookupModule = (repo: string, org: string, name: string) => {
      for (let i = 0; i < modules_list.length; i++) {
        if (
          modules_list[i].repo.url === repo &&
          modules_list[i].org === org &&
          modules_list[i].name === name
        ) {
          return modules_list[i];
        }
      }
      return null;
    };

    const WrangleFolderName = (name: string) => {
      return name.replace(/ /g, '');
    };

    const ModulesList = ({ modules_list, repo, org, btnBuildToPath }) => {
      const [confirmDialogOpen, setConfirmDialogOpen] = React.useState(false);
      const [selectedName, setSelectedName] = React.useState('');
      const [selectedType, setSelectedType] = React.useState('');
      const org_modules_list = modules_list.filter((v) => v.repo.url === repo && v.org === org);

      return (
        <>
          <DialogConfirm
            open={confirmDialogOpen}
            title="Overwrite existing module?"
            content="A module already exists at this location. Do you want to overwrite it?"
            onCancel={() => {
              setConfirmDialogOpen(false);
            }}
            onConfirm={() => {
              setConfirmDialogOpen(false);
              btnBuildToPath(repo, org, selectedType, selectedName);
            }}
          />
          {org_modules_list
            .map((m) => m.name)
            .sort()
            .map((name) => (
              <MenuItem
                key={name}
                onClick={() => {
                  setSelectedName(name);
                  setSelectedType(LookupModuleType(repo, org, name));
                  setConfirmDialogOpen(true);
                }}
              >
                {name}
              </MenuItem>
            ))}
        </>
      );
    };

    const ProjectsList = ({ modules_list, repo, btnBuildToPath }) => {
      const repo_modules_list = modules_list.filter((v) => v.repo.url === repo);

      return (
        <>
          {repo_modules_list
            .map((m) => m.org)
            .filter((v) => v !== '') // remove empty
            .filter((v, i, a) => a.indexOf(v) === i) // remove duplicates
            .sort() // sort alphabetically
            .map((org) => (
              <NestedMenuItem key={org} label={org}>
                <MenuItem
                  key={org + '_new'}
                  onClick={() => {
                    promptDialog.setTitle('New module');
                    promptDialog.setContent('Enter the name of the new module:');
                    promptDialog.setValue('');
                    promptDialog.setOnConfirm(() => () => {
                      if (!promptDialog.inputRef.current) {
                        console.error('MenuBuildModule/RepositoriesList: inputRef is null');
                        return;
                      }
                      const name = WrangleFolderName(promptDialog.inputRef.current.value);
                      // Check if module already exists
                      if (LookupModule(repo, org, name)) {
                        setAlertTitle('Module already exists');
                        setAlertContent('A module with this name already exists.');
                        setAlertOpen(true);
                      } else {
                        btnBuildToPath(repo, org, 'module', name);
                      }
                    });
                    promptDialog.setOpen(true);
                  }}
                >
                  New module
                </MenuItem>
                <Divider />
                <ModulesList
                  modules_list={repo_modules_list}
                  repo={repo}
                  org={org}
                  btnBuildToPath={btnBuildToPath}
                />
              </NestedMenuItem>
            ))}
        </>
      );
    };

    const RepositoriesList = ({ modules_list, btnBuildToPath }) => {
      const [local_modules_list, setLocalModulesList] = React.useState([]);

      React.useEffect(() => {
        // Add dummy entries to the modules_list to permit access to new projects
        setLocalModulesList(
          [...modules_list, ...dummy_modules_list].filter((m) => m.repo.type === 'local'),
        );
      }, [modules_list]);

      return (
        <>
          {local_modules_list
            .map((m) => m.repo.url)
            .filter((value, index, self) => self.indexOf(value) === index)
            .map((repo) => (
              <NestedMenuItem key={repo} label={LookupRepoName(repo)}>
                <MenuItem
                  key={repo + '_new'}
                  onClick={() => {
                    promptDialog.setTitle('New project');
                    promptDialog.setContent('Enter the name of the new project:');
                    promptDialog.setValue('');
                    promptDialog.setOnConfirm(() => () => {
                      // Add a dummy entry to the modules_list to permit access to the new project
                      if (!promptDialog.inputRef.current) {
                        console.error('MenuBuildModule/RepositoriesList: inputRef is null');
                        return;
                      }
                      const org = WrangleFolderName(promptDialog.inputRef.current.value);
                      if (LookupProject(repo, org)) {
                        setAlertTitle('Project already exists');
                        setAlertContent('A project with this name already exists.');
                        setAlertOpen(true);
                      } else {
                        const new_dummy_modules_list = [...dummy_modules_list];
                        new_dummy_modules_list.push({
                          repo: { type: 'local', url: repo },
                          org: org,
                          name: '',
                          type: 'module',
                        });
                        setDummyModulesList(new_dummy_modules_list);
                      }
                    });
                    promptDialog.setOpen(true);
                  }}
                >
                  New project
                </MenuItem>
                <Divider />
                <ProjectsList
                  modules_list={local_modules_list}
                  repo={repo}
                  btnBuildToPath={btnBuildToPath}
                />
              </NestedMenuItem>
            ))}
        </>
      );
    };

    return (
      <NestedMenuItem label={label} disabled={disabled}>
        {/* Alert dialogs */}
        <DialogAlert
          open={alertOpen}
          title={alertTitle}
          content={alertContent}
          onClose={() => {
            setAlertOpen(false);
          }}
        />

        <MenuItem id="btnBuilderBuildAsModule" onClick={btnBuildAsModule}>
          Zip file
        </MenuItem>
        <Divider />
        <RepositoriesList modules_list={modules_list} btnBuildToPath={btnBuildToPath} />
      </NestedMenuItem>
    );
  },
);
