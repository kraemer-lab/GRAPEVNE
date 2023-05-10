import unittest.mock

from builder.builder_web import GetRemoteModulesGithub

# from builder.builder_web import GetLocalModules
# from builder.builder_web import GetModulesList

# from builder.builder_web import GetRemoteModulesGithubDirectoryListing


class TestBuilderWeb(unittest.TestCase):
    def test_GetModulesList(self) -> None:
        # url: dict = {}
        # assert GetModulesList(url) == ...
        ...

    def test_GetLocalModules(self) -> None:
        # path: str = ""
        # assert GetLocalModules(path) == ...
        ...

    def test_GetRemoteModulesGithub(self) -> None:
        repo: str = "owner/repo"
        with self.assertRaises(Exception):
            GetRemoteModulesGithub(repo, "Not a valid listing type")
            GetRemoteModulesGithub(repo, "BranchListing")
        listing_type = "DirectoryListing"
        with unittest.mock.patch(
            "builder.builder_web.GetRemoteModulesGithubDirectoryListing",
            return_value=[{"name": "test"}],
        ) as mock:
            assert GetRemoteModulesGithub(repo, listing_type) == mock.return_value

    def test_GetRemoteModulesGithubDirectoryListing(self) -> None:
        # repo: str = ""
        # assert GetRemoteModulesGithubDirectoryListing(repo) == ...
        ...
