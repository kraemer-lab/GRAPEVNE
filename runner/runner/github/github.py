import git


def GetRepoStatus(repo_path, branch_name="main"):
    try:
        # Initialize the repo object
        repo = git.Repo(repo_path)

        # Fetch latest changes from the remote repository
        repo.remotes.origin.fetch()

        # Get the local branch and corresponding remote branch
        local_branch = repo.heads[branch_name]
        remote_branch = repo.remotes.origin.refs[branch_name]

        if local_branch.commit == remote_branch.commit:
            return {
                "status": "up-to-date",
                "message": f"The branch '{branch_name}' is up-to-date with the remote.",
            }
        rev_list_output = repo.git.rev_list(
            "--left-right", f"{local_branch.commit}...{remote_branch.commit}"
        )

        if "<" in rev_list_output and ">" in rev_list_output:
            return {
                "status": "diverged",
                "message": (
                    f"The branch '{branch_name}' has diverged from the remote. "
                    "Manual intervention might be needed."
                ),
            }
        elif rev_list_output.startswith("<"):
            return {
                "status": "ahead",
                "message": (
                    f"The branch '{branch_name}' is ahead of the remote. "
                    "You might want to push your changes."
                ),
            }
        elif rev_list_output.startswith(">"):
            return {
                "status": "behind",
                "message": (
                    f"The branch '{branch_name}' is behind the remote. "
                    "You might want to pull the latest changes."
                ),
            }
        else:
            return {
                "status": "diverged",
                "message": (
                    f"The branch '{branch_name}' has diverged from the remote. "
                    "Manual intervention might be needed."
                ),
            }

    except git.exc.InvalidGitRepositoryError:
        return {
            "status": "not-a-repo",
            "message": "Not a valid git repository.",
        }
    except Exception as e:
        return {"status": "error", "message": f"Error checking repo status: {str(e)}"}


def GetUntrackedFiles(repo_path):
    try:
        repo = git.Repo(repo_path)
        untracked_files = repo.untracked_files
        if not untracked_files:
            return {
                "status": "none",
                "message": "No untracked files found.",
                "untracked_files": [],
            }
        else:
            return {
                "status": "some",
                "message": "Untracked files found.",
                "untracked_files": untracked_files,
            }

    except git.exc.InvalidGitRepositoryError:
        return {
            "status": "error",
            "message": "Not a valid git repository.",
            "untracked_files": [],
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Error checking untracked files: {str(e)}",
            "untracked_files": [],
        }


def _diff_relative_to_head(repo):
    """
    Get the status of files relative to the HEAD commit.
    This is the safe approach since repo.index.diff('HEAD') appears to be inverted
    relative to HEAD, specifically new staged files are marked as deleted and deleted
    staged files are marked as added.

    :param repo: The GitPython Repo object.
    :return: A list of dictionaries, each representing a file's status.
    """
    # Use the native git diff --name-status HEAD command
    git_diff_output = repo.git.diff("--name-status", "HEAD")

    changes = []
    for line in git_diff_output.splitlines():
        status, file_path = line.split("\t")
        changes.append({"a_path": file_path, "change_type": status})

    return changes


def GetTrackedFileChanges(repo_path):
    try:
        # Initialize the repo object
        repo = git.Repo(repo_path)

        # Get the list of changed files in the working directory (not staged)
        working_dir_diff = repo.index.diff(None)

        # Get the list of files that are modified, added, or deleted
        modified_files = [
            item.a_path for item in working_dir_diff if item.change_type == "M"
        ]
        added_files = [
            item.a_path for item in working_dir_diff if item.change_type == "A"
        ]
        deleted_files = [
            item.a_path for item in working_dir_diff if item.change_type == "D"
        ]

        # Get the list of changed files in the staging area (staged but not committed)
        staged_diff = _diff_relative_to_head(repo)
        modified_files += [
            item["a_path"] for item in staged_diff if item["change_type"] == "M"
        ]
        added_files += [
            item["a_path"] for item in staged_diff if item["change_type"] == "A"
        ]
        deleted_files += [
            item["a_path"] for item in staged_diff if item["change_type"] == "D"
        ]

        modified_files = list(set(modified_files))
        added_files = list(set(added_files))
        deleted_files = list(set(deleted_files))

        all_files = modified_files + added_files + deleted_files

        if not all_files:
            return {
                "status": "none",
                "message": "No tracked file changes found.",
            }

        return {
            "status": "some",
            "modified_files": modified_files,
            "added_files": added_files,
            "deleted_files": deleted_files,
            "message": "Tracked file changes found.",
        }

    except git.exc.InvalidGitRepositoryError:
        return {
            "status": "error",
            "message": "Not a valid git repository.",
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Error checking tracked file changes: {str(e)}",
        }


def Pull(repo_path, branch_name="main"):
    """
    Pull the latest changes from the specified branch in a GitHub repository.

    :param repo_path: The local path to the Git repository.
    :param branch_name: The name of the branch to pull from (default is 'main').
    :return: None
    """
    try:
        # Initialize the repository object
        repo = git.Repo(repo_path)

        # Ensure the repository is clean before pulling
        if repo.is_dirty(untracked_files=True):
            return {
                "status": "error",
                "message": (
                    "Your repository has uncommitted changes or "
                    "untracked files. Please commit or stash them before pulling."
                ),
            }

        # Pull the latest changes from the specified branch
        repo.git.pull("origin", branch_name)

    except git.exc.GitCommandError as e:
        return {"status": "error", "message": f"Error pulling the latest changes: {e}"}
    except git.exc.InvalidGitRepositoryError:
        return {
            "status": "error",
            "message": "Not a valid git repository.",
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Error pulling the latest changes: {str(e)}",
        }
    return {"status": "success", "message": "Successfully pulled the latest changes."}


def Push(repo_path, branch_name="main"):
    """
    Push commits from the local repository to the specified branch on GitHub.

    :param repo_path: The local path to the Git repository.
    :param branch_name: The name of the branch to push to (default is 'main').
    :return: None
    """
    try:
        # Initialize the repository object
        repo = git.Repo(repo_path)

        # Check if there are any commits to push
        if repo.is_dirty(untracked_files=True):
            return {
                "status": "error",
                "message": (
                    "Your repository has uncommitted changes or "
                    "untracked files. Please commit or stash them before pushing."
                ),
            }

        # Ensure that the branch exists
        if branch_name not in repo.heads:
            return {
                "status": "error",
                "message": (
                    f"The branch '{branch_name}' does " "not exist in the repository."
                ),
            }

        # Push the commits to the specified branch
        repo.git.push("origin", branch_name)

    except git.exc.GitCommandError as e:
        return {"status": "error", "message": f"Error pushing commits: {e}"}
    except git.exc.InvalidGitRepositoryError:
        return {
            "status": "error",
            "message": "Not a valid git repository.",
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Error pushing commits: {str(e)}",
        }
    return {"status": "success", "message": "Successfully pushed the commits."}


def StageFiles(repo_path, files_to_stage):
    """
    Stage one or more files in the Git repository.

    :param repo_path: The local path to the Git repository.
    :param files_to_stage: A list of file paths to stage.
    :return: None
    """
    try:
        # Initialize the repository object
        repo = git.Repo(repo_path)

        # Stage the specified files
        repo.index.add(files_to_stage)

    except git.exc.InvalidGitRepositoryError:
        return {
            "status": "error",
            "message": "Not a valid git repository.",
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Error staging files: {str(e)}",
        }
    return {
        "status": "success",
        "message": "Successfully staged the files.",
        "staged_files": files_to_stage,
    }


def UnstageFiles(repo_path, files_to_unstage):
    """
    Unstage one or more files in the Git repository.

    :param repo_path: The local path to the Git repository.
    :param files_to_unstage: A list of file paths to unstage.
    :return: None
    """
    try:
        # Initialize the repository object
        repo = git.Repo(repo_path)

        # Unstage the specified files (equivalent to 'git restore --staged <file>')
        repo.index.remove(files_to_unstage, working_tree=False)

    except git.exc.InvalidGitRepositoryError:
        return {
            "status": "error",
            "message": "Not a valid git repository.",
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"An unexpected error occurred: {e}",
        }
    return {
        "status": "success",
        "message": "Successfully unstaged the files.",
        "unstaged_files": files_to_unstage,
    }


def Commit(repo_path, commit_message, author_name=None, author_email=None):
    """
    Commit the staged files in the Git repository with a specified commit message.

    :param repo_path: The local path to the Git repository.
    :param commit_message: The commit message.
    :param author_name: The name of the author (optional).
    :param author_email: The email of the author (optional).
    :return: None
    """
    try:
        # Initialize the repository object
        repo = git.Repo(repo_path)

        # Check if there are staged changes
        if not repo.index.diff("HEAD") and not repo.untracked_files:
            return

        # Set up the author information if provided
        if author_name and author_email:
            author = git.Actor(author_name, author_email)
            commit = repo.index.commit(commit_message, author=author)
        else:
            commit = repo.index.commit(commit_message)

    except git.exc.InvalidGitRepositoryError:
        return {
            "status": "error",
            "message": "Not a valid git repository.",
        }
    except git.exc.GitCommandError as e:
        return {
            "status": "error",
            "message": f"Error committing files: {e}",
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"An unexpected error occurred: {e}",
        }
    return {
        "status": "success",
        "message": "Successfully committed the changes.",
        "commit_message": commit.message,
    }


def Clone(github_url, clone_to_path):
    """
    Clone a GitHub repository to a specified local directory.

    :param github_url: The URL of the GitHub repository to clone.
    :param clone_to_path: The local directory where the repository should be cloned.
    :return: None
    """
    try:
        # Clone the repository
        git.Repo.clone_from(github_url, clone_to_path)

    except git.exc.GitCommandError as e:
        return {
            "status": "error",
            "message": f"Error cloning repository: {e}",
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"An unexpected error occurred: {e}",
        }
    return {
        "status": "success",
        "message": "Successfully cloned the repository.",
    }


def CommitAllChanges(repo_path, commit_message, author_name=None, author_email=None):
    """
    Commit all changes in the Git repository with a specified commit message.

    :param repo_path: The local path to the Git repository.
    :param commit_message: The commit message.
    :param author_name: The name of the author (optional).
    :param author_email: The email of the author (optional).
    :return: None
    """
    try:
        # Initialize the repository object
        repo = git.Repo(repo_path)

        # Check if there are any changes to commit
        if not repo.is_dirty(untracked_files=True):
            return {
                "status": "none",
                "message": "No changes to commit.",
            }

        # Stage all changes
        repo.git.add("--all")

        # Set up the author information if provided
        if author_name and author_email:
            author = git.Actor(author_name, author_email)
            commit = repo.index.commit(commit_message, author=author)
        else:
            commit = repo.index.commit(commit_message)

    except git.exc.InvalidGitRepositoryError:
        return {
            "status": "error",
            "message": "Not a valid git repository.",
        }
    except git.exc.GitCommandError as e:
        return {
            "status": "error",
            "message": f"Error committing files: {e}",
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"An unexpected error occurred: {e}",
        }
    return {
        "status": "success",
        "message": "Successfully committed all changes.",
        "commit_message": commit.message,
    }
