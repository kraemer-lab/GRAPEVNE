from app import main


def test_main():
    assert main() == "<p>Phyloflow flask server is running</p>"
