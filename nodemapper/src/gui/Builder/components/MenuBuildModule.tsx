import MenuItem from '@mui/material/MenuItem';
import { DialogConfirm } from 'components/DialogConfirm';
import { DialogPrompt } from 'components/DialogPrompt';
import { NestedMenuItem, useMenu } from 'components/DropdownMenu';
import React from 'react';
import { builderBuildAsModule } from 'redux/actions';
import { useAppDispatch, useAppSelector } from 'redux/store/hooks';

export const MenuBuildModule = () => {
  const dispatch = useAppDispatch();
  const modules_list = useAppSelector((state) => state.builder.modules_list);
  const repositories = useAppSelector((state) => state.settings.repositories);
  const { closeAllMenus } = useMenu();

  // Build as module
  const btnBuildAsModule = () => {
    dispatch(builderBuildAsModule());
    closeAllMenus();
  };

  // New project
  const btnNewProject = () => {
    alert(`New project`);
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

  const ModulesList = ({ modules_list, repo, org, btnBuildToPath }) => {
    const [confirmDialogOpen, setConfirmDialogOpen] = React.useState(false);
    const [selectedName, setSelectedName] = React.useState('');
    const [selectedType, setSelectedType] = React.useState('');
    const org_modules_list = modules_list.filter((v) => ((v.repo.url === repo) && (v.org === org)));

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
    const [promptDialogOpen, setPromptDialogOpen] = React.useState(false);
    const [promptDialogValue, setPromptDialogValue] = React.useState('');
    const [selectedOrg, setSelectedOrg] = React.useState('');
    const repo_modules_list = modules_list.filter((v) => v.repo.url === repo);

    const folderName = (name: string) => {
      return name.replace(/ /g, '');
    };

    return (
      <>
        <DialogPrompt
          open={promptDialogOpen}
          value={promptDialogValue}
          title="New module"
          content="Enter the name of the new module:"
          onChange={(event) => {
            setPromptDialogValue(event.target.value);
          }}
          onCancel={() => {
            setPromptDialogOpen(false);
          }}
          onConfirm={() => {
            setPromptDialogOpen(false);
            btnBuildToPath(repo, selectedOrg, "module", folderName(promptDialogValue));
          }}
        />
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
                  setSelectedOrg(org);
                  setPromptDialogValue('');
                  setPromptDialogOpen(true);
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
  }

  const RepositoriesList = ({ modules_list, btnBuildToPath }) => {
    const [promptDialogOpen, setPromptDialogOpen] = React.useState(false);
    const [promptDialogValue, setPromptDialogValue] = React.useState('');
    const [selectedUrl, setSelectedUrl] = React.useState('');
    const [local_modules_list, setLocalModulesList] = React.useState([]);

    React.useEffect(() => {
      setLocalModulesList(modules_list.filter((m) => m.repo.type === 'local'));
    }, [modules_list]);

    return (
      <>
        <DialogPrompt
          open={promptDialogOpen}
          value={promptDialogValue}
          title="New project"
          content="Enter the name of the new project:"
          onChange={(event) => {
            setPromptDialogValue(event.target.value);
          }}
          onCancel={() => {
            setPromptDialogOpen(false);
          }}
          onConfirm={() => {
            setPromptDialogOpen(false);
            // Add a dummy entry to the modules_list to permit access to the new project
            const new_modules_list = modules_list.slice();
            new_modules_list.push({
              repo: { url: selectedUrl, type: 'local' },
              org: promptDialogValue,
              name: "",
              type: 'module',
            });
            setLocalModulesList(new_modules_list);
          }}
        />
        {local_modules_list
          .map((m) => m.repo.url)
          .filter((value, index, self) => self.indexOf(value) === index)
          .map((repo) => (
            <NestedMenuItem key={repo} label={LookupRepoName(repo)}>
              <MenuItem
                key={repo + '_new'}
                onClick={() => {
                  setSelectedUrl(repo);
                  setPromptDialogValue('');
                  setPromptDialogOpen(true);
                }}
              >
                New project
              </MenuItem>
              <hr />
              <ProjectsList modules_list={local_modules_list} repo={repo} btnBuildToPath={btnBuildToPath} />
            </NestedMenuItem>
          ))}
      </>
    );
  }

  return (
    <NestedMenuItem label="BUILD MODULE">
      <MenuItem id="btnBuilderBuildAsModule" onClick={btnBuildAsModule}>
        Zip file
      </MenuItem>
      <hr />
      <RepositoriesList modules_list={modules_list} btnBuildToPath={btnBuildToPath} />
    </NestedMenuItem>
  );
};
