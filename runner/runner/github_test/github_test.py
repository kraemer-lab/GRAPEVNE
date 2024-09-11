from unittest.mock import MagicMock
from unittest.mock import patch

import git
import pytest

from runner.github import GetRepoStatus  # Import GetRepoStatus


@pytest.fixture
def mock_repo():
    # This fixture will allow us to easily set up different scenarios
    def _mock_repo(local_commit, remote_commit, rev_list_output):
        mock_repo = MagicMock()
        mock_repo.heads["main"].commit = local_commit
        mock_repo.remotes.origin.refs["main"].commit = remote_commit
        mock_repo.git.rev_list.return_value = rev_list_output
        return mock_repo

    return _mock_repo


@patch("runner.github.github.git.Repo")
def test_repo_is_up_to_date(mock_git_repo, mock_repo):
    mock_repo_instance = mock_repo("abc123", "abc123", "")
    mock_git_repo.return_value = mock_repo_instance

    result = GetRepoStatus("/fake/path/to/repo", "main")
    assert result["status"] == "up-to-date"
    assert result["message"] == "The branch 'main' is up-to-date with the remote."


@patch("runner.github.github.git.Repo")
def test_repo_is_behind(mock_git_repo, mock_repo):
    mock_repo_instance = mock_repo("abc123", "def456", ">")
    mock_git_repo.return_value = mock_repo_instance

    result = GetRepoStatus("/fake/path/to/repo", "main")
    assert result["status"] == "behind"
    assert result["message"] == (
        "The branch 'main' is behind the remote. "
        "You might want to pull the latest changes."
    )


@patch("runner.github.github.git.Repo")
def test_repo_is_ahead(mock_git_repo, mock_repo):
    mock_repo_instance = mock_repo("def456", "abc123", "<")
    mock_git_repo.return_value = mock_repo_instance

    result = GetRepoStatus("/fake/path/to/repo", "main")
    assert result["status"] == "ahead"
    assert result["message"] == (
        "The branch 'main' is ahead of the remote. "
        "You might want to push your changes."
    )


@patch("runner.github.github.git.Repo")
def test_repo_has_diverged(mock_git_repo, mock_repo):
    mock_repo_instance = mock_repo("def456", "abc123", "<abc123\n>def456")
    mock_git_repo.return_value = mock_repo_instance

    result = GetRepoStatus("/fake/path/to/repo", "main")
    assert result["status"] == "diverged"
    assert result["message"] == (
        "The branch 'main' has diverged from the remote. "
        "Manual intervention might be needed."
    )


@patch("runner.github.github.git.Repo")
def test_git_command_error(mock_git_repo):
    mock_repo_instance = MagicMock()
    mock_repo_instance.remotes.origin.fetch.side_effect = git.exc.GitCommandError(
        "fake command", 1
    )
    mock_git_repo.return_value = mock_repo_instance

    result = GetRepoStatus("/fake/path/to/repo", "main")
    assert result["status"] == "error"
    assert "Error checking repo status" in result["message"]
