import MenuItem from '@mui/material/MenuItem';
import { DialogConfirm } from 'components/DialogConfirm';
import { NestedMenuItem, useMenu } from 'components/DropdownMenu';
import React, { forwardRef } from 'react';
import { builderBuildAsModule } from 'redux/actions';
import { useAppDispatch, useAppSelector } from 'redux/store/hooks';
import { HeaderDialogPromptProps } from '../Header';

interface MenuBuildModuleProps {
  promptDialog: HeaderDialogPromptProps;
}

export const MenuBuildModule = forwardRef(({ promptDialog }: MenuBuildModuleProps) => {
  const dispatch = useAppDispatch();
  const modules_list = useAppSelector((state) => state.builder.modules_list);
  const repositories = useAppSelector((state) => state.settings.repositories);
  const { closeAllMenus } = useMenu();

  // Dummy modules list stores new projects until they contain modules
  // This list reinitialises each time the Build menu is opened
  const [dummy_modules_list, setDummyModulesList] = React.useState([]);

  // Build as module
  const btnBuildAsModule = () => {
    dispatch(builderBuildAsModule());
    closeAllMenus();
  };

  // Build module to existing path
  const btnBuildToPath = (repo: string, org: string, type: string, name: string) => {
    dispatch(builderBuildAsModule(`${repo}/workflows/${org}/${type}s/${name}`));
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
                    btnBuildToPath(repo, org, 'module', name);
                  });
                  promptDialog.setOpen(true);
                }}
              >
                New module
              </MenuItem>
              <hr />
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
                    const new_dummy_modules_list = [...dummy_modules_list];
                    new_dummy_modules_list.push({
                      repo: { type: 'local', url: repo },
                      org: org,
                      name: '',
                      type: 'module',
                    });
                    setDummyModulesList(new_dummy_modules_list);
                  });
                  promptDialog.setOpen(true);
                }}
              >
                New project
              </MenuItem>
              <hr />
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
    <NestedMenuItem label="BUILD MODULE">
      <MenuItem id="btnBuilderBuildAsModule" onClick={btnBuildAsModule}>
        Zip file
      </MenuItem>
      <hr />
      <RepositoriesList modules_list={modules_list} btnBuildToPath={btnBuildToPath} />
    </NestedMenuItem>
  );
});
